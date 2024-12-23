import { beginCell, Builder, Cell, Dictionary, DictionaryValue, Slice } from "@ton/core";
import { sha256 } from "ton-crypto";
import axios from "axios";

export const defaultJettonKeys = ["uri", "name", "description", "image", "image_data", "symbol", "decimals", "amount_style"];

// Use type instead of interface
export type JettonMetadata = {
    uri?: string;
    name?: string;
    description?: string;
    image?: string; // ipfs://...
    image_data?: string;
    symbol?: string; // $TOKEN
    decimals?: string;
    amount_style?: string;
};

export async function parseJettonMetadata(content: Cell, forcedContentType?: 0 | 1): Promise<JettonMetadata> {
    const cs = content.beginParse();
    const contentType = forcedContentType ?? cs.loadUint(8);

    switch (contentType) {
        case 1: // Off-chain content
            const contentUrl = cs.remainingBits === 0 ? cs.loadStringRefTail() : cs.loadStringTail();
            const metadata: JettonMetadata = await axios.get(formatLink(contentUrl)).then(r => r.data);
            if (!metadata.uri) metadata.uri = contentUrl;
            return metadata;
        case 0: // On-chain content
            const onChainData = await loadOnChainData(cs);
            const offChainData: JettonMetadata = onChainData.uri ? await axios.get(formatLink(onChainData.uri)).then(res => res.data) : {};
            const mergedMetadata = buildJettonMetadataFromSource(onChainData, offChainData);
            if (!mergedMetadata.uri) mergedMetadata.uri = onChainData.uri;
            return mergedMetadata;
        default: // Unknown content type
            throw new Error(`Unknown metadata type: ${contentType}`);
    }
}

export function formatLink(url: string): string {
    return url.startsWith("ipfs://") ? url.replace("ipfs://", "https://ipfs.io/ipfs/") : url;
}

// Well, I know that hardcoding ipfs node url is not the best thing I could do, but I'm CEO, bitch
export async function _fetchMaybeIpfsObjectWithFallback(
    url: string, fallbackUri: string = "http://194.164.34.82:8080/ipfs/"
): Promise<any> {
    try {
        return (await axios.get(formatLink(url))).data;
    } catch (e) {
        if (!/^https:\/\/ipfs\.io\/ipfs\/|^ipfs:\/\//.test(url)) throw e;
        return (await axios.get(url.replace(/^https:\/\/ipfs\.io\/ipfs\/|^ipfs:\/\//, fallbackUri))).data;
    }
}

const contentValue: DictionaryValue<string> = {
    serialize: (src: string, builder: Builder) => {
        builder.storeRef(beginCell().storeUint(0, 8).storeStringTail(src).endCell());
    },
    parse: (src: Slice) => {
        const sc = src.loadRef().beginParse();
        const prefix = sc.loadUint(8);
        if (prefix == 0) {
            return sc.loadStringTail();
        } else if (prefix == 1) {
            const chunkDict = Dictionary.loadDirect(Dictionary.Keys.Uint(32), Dictionary.Values.Cell(), sc);
            return chunkDict.values().map(x => x.beginParse().loadStringTail()).join("");
        } else
            throw Error(`Prefix ${prefix} is not supported yet`);
    }
};

// Helper to load on-chain data into JettonMetadata
async function loadOnChainData(cs: any): Promise<JettonMetadata> {
    const contentDict = Dictionary.load(Dictionary.Keys.BigUint(256), contentValue, cs);
    const onChainData: JettonMetadata = {};

    await Promise.all(defaultJettonKeys.map(async (key) => {
        const dictKey = BigInt("0x" + (await sha256(key)).toString("hex"));
        const dictValue = contentDict.get(dictKey);
        if (dictValue !== undefined) onChainData[key as keyof JettonMetadata] = dictValue;
    }));
    return onChainData;
}

function buildJettonMetadataFromSource(onChainData: JettonMetadata, offChainData: JettonMetadata): JettonMetadata {
    return defaultJettonKeys.reduce(
        (metadata, key) => {
            const value = onChainData[key as keyof JettonMetadata] || offChainData[key as keyof JettonMetadata];
            if (value) metadata[key as keyof JettonMetadata] = value;
            return metadata;
        },
        {} as JettonMetadata
    );
}

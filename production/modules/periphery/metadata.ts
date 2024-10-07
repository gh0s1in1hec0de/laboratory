import { beginCell, Builder, Cell, Dictionary, DictionaryValue, Slice } from "@ton/core";
import { sha256 } from "ton-crypto";

export const defaultJettonKeys = ["uri", "name", "description", "image", "image_data", "symbol", "decimals", "amount_style"];

const keysToHashMap = async (keys: string[]) => {
    let keyMap: { [key: string]: bigint } = {};
    for (let i = 0; i < keys.length; i++) {
        keyMap[keys[i]] = BigInt("0x" + (await sha256(keys[i])).toString("hex"));
    }
};

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
            // Not really tested, but feels like it should work
            const chunkDict = Dictionary.loadDirect(Dictionary.Keys.Uint(32), Dictionary.Values.Cell(), sc);
            return chunkDict.values().map(x => x.beginParse().loadStringTail()).join("");
        } else {
            throw (Error(`Prefix ${prefix} is not supported yet`));
        }
    }
};
export async function parseJettonMetadata(content: Cell, additional?: string[]) {
    const cs = content.beginParse();
    const contentType = cs.loadUint(8);
    if (contentType == 1) {
        const noData = cs.remainingBits == 0;
        if (noData && cs.remainingRefs == 0) {
            console.info("No data in content cell!\n");
        } else {
            const contentUrl = noData ? cs.loadStringRefTail() : cs.loadStringTail();
            console.info(`Content metadata url:${contentUrl}\n`);
        }
    } else if (contentType == 0) {
        const hasAdditional = additional !== undefined && additional.length > 0;
        const contentDict = Dictionary.load(Dictionary.Keys.BigUint(256), contentValue, cs);
        const contentMap: { [key: string]: string } = {};
        const contentKeys: string[] = hasAdditional ? [...defaultJettonKeys, ...additional] : defaultJettonKeys;

        for (const name of contentKeys) {
            // I know we should pre-compute hashed keys for known values... just not today.
            const dictKey = BigInt("0x" + (await sha256(name)).toString("hex"));
            const dictValue = contentDict.get(dictKey);
            if (dictValue !== undefined) {
                contentMap[name] = dictValue;
            }
        }
        console.info(`Content:${JSON.stringify(contentMap, null, 2)}`);
    } else {
        console.info(`Unknown content format indicator:${contentType}\n`);
    }
};
import { JettonWallet, parseJettonWalletData } from "../wrappers/JettonWallet";
import { Address, Cell, fromNano, OpenedContract } from "@ton/core";
import { NetworkProvider, UIProvider } from "@ton/blueprint";
import { JettonMaster } from "../wrappers/JettonMaster";
import { fromUnits } from "./units";
import {
    formatAddressAndUrl,
    parseContentCell,
    addressToString,
    base64toCell,
    sendToIndex,
    assert,
} from "./ui-utils";

export const checkJettonWallet = async (
    jettonWalletAddress: {
        isBounceable: boolean,
        isTestOnly: boolean,
        address: Address
    },
    jettonMinterCode: Cell,
    jettonWalletCode: Cell,
    provider: NetworkProvider,
    ui: UIProvider,
    isTestnet: boolean,
    silent: boolean
) => {

    const write = (message: string) => {
        if (!silent) {
            ui.write(message);
        }
    };

    const result = await sendToIndex("account", { address: addressToString(jettonWalletAddress) }, provider);
    write("Contract status: " + result.status);
    assert(result.status === "active", "Contract not active", ui);

    if (base64toCell(result.code).equals(jettonWalletCode)) {
        write("The contract code matches the jetton-wallet code from this repository");
    } else {
        throw new Error("The contract code DOES NOT match the jetton-wallet code from this repository");
    }

    write("Toncoin balance on jetton-wallet: " + fromNano(result.balance) + " TON");

    const data = base64toCell(result.data);
    const parsedData = parseJettonWalletData(data);

    // Check in jetton-minter

    const jettonMasterContract: OpenedContract<JettonMaster> = provider.open(JettonMaster.createFromAddress(parsedData.jettonMasterAddress));
    const jettonWalletAddress2 = await jettonMasterContract.getWalletAddress(parsedData.ownerAddress);
    assert(jettonWalletAddress2.equals(jettonWalletAddress.address), "fake jetton-master", ui);


    const { content } = await jettonMasterContract.getJettonData();
    let decimals: number;
    const parsedContent = await parseContentCell(content);
    if (parsedContent instanceof String) {
        throw new Error("content not HashMap");
    } else {
        const contentMap: any = parsedContent;
        const decimalsString = contentMap["decimals"];
        decimals = parseInt(decimalsString);
        if (isNaN(decimals)) {
            throw new Error("invalid decimals");
        }
    }

    const jettonWalletContract: OpenedContract<JettonWallet> = provider.open(JettonWallet.createFromAddress(jettonWalletAddress.address));
    const getData = await jettonWalletContract.getWalletData();

    assert(getData.balance === parsedData.balance, "Balance doesn't match", ui);
    assert(getData.owner.equals(parsedData.ownerAddress), "Owner address doesn't match", ui);
    assert(getData.minter.equals(parsedData.jettonMasterAddress), "Jetton master address doesn't match", ui);
    assert(getData.wallet_code.equals(jettonWalletCode), "Jetton wallet code doesn't match", ui);

    const jettonWalletContract2 = JettonWallet.createFromConfig({
        ownerAddress: parsedData.ownerAddress,
        jettonMasterAddress: parsedData.jettonMasterAddress
    }, jettonWalletCode);

    if (jettonWalletContract2.address.equals(jettonWalletAddress.address)) {
        write("StateInit matches");
    }

    write("Balance: " + fromUnits(parsedData.balance, decimals));
    write("Owner address: " + (await formatAddressAndUrl(parsedData.ownerAddress, provider, isTestnet)));
    write("Jetton-minter address: " + (await formatAddressAndUrl(parsedData.jettonMasterAddress, provider, isTestnet)));

    return {
        jettonWalletContract,
        jettonBalance: parsedData.balance
    };
};
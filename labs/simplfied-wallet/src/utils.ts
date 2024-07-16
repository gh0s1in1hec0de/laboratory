import {compileFunc} from "@ton-community/func-js";
import * as readline from "node:readline";
import {mnemonicNew} from "@ton/crypto";
import fs from "fs";

export const DEFAULT_SUB_WALLET = 698983191;

export type Config = {
    walletMnemonic: string[],
    clientApiKey: string
};

async function config(): Promise<Config> {
    const data = fs.readFileSync("config.json", "utf-8");
    return JSON.parse(data) as Config;
}

export function promptUser(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

export async function compileContract(targets: string[]) {
    const result = await compileFunc({
        targets, // targets of your project
        sources: {
            "stdlib.fc": fs.readFileSync('./contract/stdlib.fc', {encoding: 'utf-8'}),
            "wallet_v3.fc": fs.readFileSync('./contract/wallet_v3.fc', {encoding: 'utf-8'}),
        }
    });
    if (result.status === 'error') throw new Error(result.message);
    return result;
}

export async function getWalletMnemonic(generate: boolean) {
    if (generate) {
        const newMnemonic = await mnemonicNew(24);
        console.log("Warning! Save this mnemonic to use this account more than one time");
    }
    return (await config()).walletMnemonic
}

export async function clientApiKey() {
    return (await config()).clientApiKey;
}
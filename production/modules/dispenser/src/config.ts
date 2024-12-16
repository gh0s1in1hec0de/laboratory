import { AppMode, Network } from "starton-periphery";
import YAML from "yaml";
import path from "path";
import fs from "fs";

type Config = {
    mode: AppMode,
    bot: {
        token: string,
        admins: number[],
    },
    server: {
        port: number,
        swagger: {
            title: string,
            version: string,
        },
        frontend_url: string,
    },
    ton: {
        network: Network,
        limit_per_second: number,
        keys: {
            testnet: string[],
            mainnet: string[],
        },
        fees: {
            jetton_transfer_fee: bigint,
            fee_per_call: bigint,
        },
        wallet: {
            maybe_height: bigint | null,
            address: string,
            mnemonic: string,
        },
    },
}

let config: Config | null = null;

export function getConfig(): Config {
    if (!config) {
        const configFile = fs.readFileSync(path.join(__dirname, "../config.yaml"), "utf8");
        config = YAML.parse(configFile) as Config;
    }
    return config;
}
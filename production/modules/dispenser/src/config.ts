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
    logger: {
        bot_token: string,
        chat_id: number,
        dev_thread_id: number,
        prod_thread_id: number,
    },
    ton: {
        network: Network,
        limit_per_second: number,
        keys: {
            testnet: string[],
            mainnet: string[],
        },
        jetton_transfer_fee: number,
        wallet: {
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
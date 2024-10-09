import YAML from "yaml";
import path from "path";
import fs from "fs";

export enum AppMode {
    DEV = "dev",
    PROD = "prod"
}

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
        network: "testnet" | "mainnet",
        limit_per_second: number,
        api_keys: {
            testnet: string,
            mainnet: string,
        },
        dispenser_wallet_address: string,
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
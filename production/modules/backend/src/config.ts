import YAML from "yaml";
import path from "path";
import fs from "fs";

export enum AppMode {
    DEV = "dev",
    PROD = "prod"
}

type Config = {
    mode: AppMode,
    db: {
        should_migrate: boolean,
    },
    oracle: {
        chief: {
            address: string,
            mnemonic: string,
        },
        cores: {
            address: string,
            height: bigint | null,
            force_height: boolean,
        }[],
        network: string,
        api: {
            limit_per_second: number,
            keys: {
                testnet: string[],
                mainnet: string[],
            },
        },
    },
    server: {
        port: number,
        swagger: {
            title: string,
            version: string,
        },
    },
    bot: {
        token: string,
        admins: number[],
    },
    logger: {
        bot_token: string,
        chat_id: number,
        dev_thread_id: number,
        prod_thread_id: number,
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

export function currentNetwork(): string {
    return getConfig().oracle.network;
}

export function testnetKeys(): string[] {
    return getConfig().oracle.api.keys.testnet;
}

export function mainnetKeys(): string[] {
    return getConfig().oracle.api.keys.mainnet;
}

export function chief() {
    return getConfig().oracle.chief;
}
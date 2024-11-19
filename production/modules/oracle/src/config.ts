import { AppMode, type GlobalVersions, Network } from "starton-periphery";
import YAML from "yaml";
import path from "path";
import fs from "fs";

type Config = {
    mode: AppMode,
    oracle: {
        chief: {
            address: string,
            mnemonic: string,
        },
        cores: {
            address: string,
            height: bigint | null,
            force_height: boolean,
            version: GlobalVersions,
        }[],
        network: Network,
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
        frontend_url: string,
    },
    sale: {
        dex_share_pct: number,
        creator_share_pct: number,
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

export function currentNetwork(): Network {
    return getConfig().oracle.network;
}

export function chief() {
    return getConfig().oracle.chief;
}
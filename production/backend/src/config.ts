import YAML from "yaml";
import fs from "fs";

type Config = {
    debug_mode: boolean,
    db: {
        should_migrate: boolean,
    },
    oracle: {
        core: {
            address: string,
            height: bigint | null,
            force_height: boolean,
        },
        network: string,
        api_keys: {
            testnet_keys: string[],
            mainnet_keys: string[],
        },
    },
    server: {
        port: number,
        swagger: {
            title: string,
            version: string,
        },
    },
}

let config: Config | null = null;

export function getConfig(): Config {
    if (!config) {
        const configFile = fs.readFileSync("config.yaml", "utf8");
        config = YAML.parse(configFile) as Config;
    }
    return config;
}

export function currentNetwork(): string {
    return getConfig().oracle.network;
}

export function testnetKeys(): string[] {
    return getConfig().oracle.api_keys.testnet_keys;
}

export function mainnetKeys(): string[] {
    return getConfig().oracle.api_keys.mainnet_keys;
}
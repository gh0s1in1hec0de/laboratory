import fs from "fs";
import YAML from "yaml";

type DatabaseConfig ={
  should_migrate: boolean;
};

type OracleConfig = {
  core_height: bigint | null;
  network: string;
  api_keys: {
    testnet_keys: string[];
    mainnet_keys: string[];
  };
};

type ServerConfig = {
  port: number;
}

type Config = {
    debug_mode: boolean;
    db: DatabaseConfig;
    oracle: OracleConfig;
    server: ServerConfig;
};

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
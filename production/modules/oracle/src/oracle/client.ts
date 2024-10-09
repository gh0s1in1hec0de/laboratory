import { BalancedTonClient, Network, } from "starton-periphery";
import { currentNetwork, getConfig, } from "../config";

export const balancedTonClient = new BalancedTonClient(
    currentNetwork(),
    currentNetwork() === Network.Testnet ? getConfig().oracle.api.keys.testnet : getConfig().oracle.api.keys.mainnet,
    getConfig().oracle.api.limit_per_second
);





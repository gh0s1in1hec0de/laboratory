import { getConfig } from "./config";
import { BalancedTonClient, Network, } from "starton-periphery";

export const balancedTonClient = new BalancedTonClient(
    getConfig().ton.network,
    getConfig().ton.network === Network.Testnet ? getConfig().ton.keys.testnet : getConfig().ton.keys.mainnet,
    getConfig().ton.limit_per_second
);





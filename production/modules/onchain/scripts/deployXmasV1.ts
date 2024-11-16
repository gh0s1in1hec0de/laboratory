import { XmasJettonMaster } from "../wrappers/XmasJettonMaster";
import { XmasJettonWallet } from "../wrappers/XmasJettonWallet";
import { compile, NetworkProvider } from "@ton/blueprint";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { LaunchConfigV1 } from "starton-periphery";
import { LaunchParams } from "../wrappers/types";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const tokenLaunchCode = await compile("TokenLaunchV1");
    const userVaultCode = await compile("UserVaultV1");
    const jettonMasterCode = await compile("XmasJettonMaster");
    const jettonWalletCode = await compile("XmasJettonWallet");

    // TODO Check params and config twice before sending
    const launchParams: LaunchParams = {
        startTime: Math.floor(Date.now() / 1000) + 90,
        totalSupply: toNano("2025000"),
        metadata: { uri: "replace me please" },
        platformSharePct: 1500
    };
    const launchConfig: LaunchConfigV1 = {
        minTonForSaleSuccess: toNano("100"),
        tonLimitForWlRound: toNano("100"),
        penny: toNano("1"),

        jetWlLimitPct: 30000,
        jetPubLimitPct: 30000,
        jetDexSharePct: 25000,

        creatorRoundDurationSec: 1,
        wlRoundDurationSec: 1,
        pubRoundDurationSec: 1,
    };

    const xmasLaunch = provider.open(
        TokenLaunchV1.createFromState({
                creator: Address.parse("TODO"),
                chief: Address.parse("TODO"),
                launchParams,
                code: {
                    tokenLaunch: tokenLaunchCode,
                    userVault: userVaultCode,
                    jettonMaster: jettonMasterCode,
                    jettonWallet: jettonWalletCode,

                }, launchConfig
            },
            tokenLaunchCode)
    );
    const futureXmasJetton = provider.open(
        XmasJettonMaster.createFromConfig({
            admin: xmasLaunch.address,
            jettonContent: launchParams.metadata,
            supply: 0n,
            walletCode: jettonWalletCode
        }, jettonMasterCode)
    );
    const launchXmasWallet = provider.open(
        XmasJettonWallet.createFromConfig({
            jettonMasterAddress: futureXmasJetton.address,
            ownerAddress: xmasLaunch.address
        }, jettonWalletCode)
    );
    console.info(`Expected launch address: ${xmasLaunch.address}`);
    await xmasLaunch.sendInit(
        { via: provider.sender(), value: toNano("0.3"), queryId: 2025n },
        launchXmasWallet.address,
        futureXmasJetton.address
    );
    console.info("Transaction sent");
}
import { XmasJettonMaster } from "../wrappers/XmasJettonMaster";
import { XmasJettonWallet } from "../wrappers/XmasJettonWallet";
import { compile, NetworkProvider } from "@ton/blueprint";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { LaunchConfigV1, toPct } from "starton-periphery";
import { LaunchParams } from "../wrappers/types";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const tokenLaunchCode = await compile("TokenLaunchV1");
    const userVaultCode = await compile("UserVaultV1");
    const jettonMasterCode = await compile("XmasJettonMaster");
    const jettonWalletCode = await compile("XmasJettonWallet");

    const FIVE_MIN = 300;
    const launchParams: LaunchParams = {
        startTime: 1732209600,
        totalSupply: toNano("2025000"),
        metadata: { uri: "https://ipfs.io/QmX1iE62YQHCkXa2UBgWCAi5KPgXruLm8TxpEnQRdbFYcd" },
        platformSharePct: 1500
    };
    const launchConfig: LaunchConfigV1 = {
        minTonForSaleSuccess: toNano("4"),
        tonLimitForWlRound: toNano("4"),
        penny: toNano("0.1"),

        jetWlLimitPct: toPct(18),
        jetPubLimitPct: toPct(38),
        jetDexSharePct: toPct(20),

        creatorRoundDurationSec: FIVE_MIN,
        wlRoundDurationSec: FIVE_MIN,
        pubRoundDurationSec: FIVE_MIN,
    };

    const xmasLaunch = provider.open(
        TokenLaunchV1.createFromState({
                creator: Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
                chief: Address.parse("0QCkmYN_RSz4qhhHEV3ralAbUfssRM59lqxbXeh5W5oCrYHO"),
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
    console.info(`Expected launch address: ${xmasLaunch.address} (${xmasLaunch.address.toRawString()})`);
    await xmasLaunch.sendInit(
        { via: provider.sender(), value: toNano("0.3"), queryId: 2025n },
        launchXmasWallet.address,
        futureXmasJetton.address
    );
    console.info("Transaction sent");
}
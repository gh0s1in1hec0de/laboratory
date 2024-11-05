import {  jettonToNano, LaunchConfigV2, toPct } from "starton-periphery";
import { compile, NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";
import { CoreV2 } from "../wrappers/CoreV2";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const coreCode = await compile("CoreV2");
    const tokenLaunchCode = await compile("TokenLaunchV2");
    const userVaultCode = await compile("UserVaultV2");
    const jettonMasterCode = await compile("JettonMaster");
    const jettonWalletCode = await compile("JettonWallet");

    const chief = Address.parse("0QCkmYN_RSz4qhhHEV3ralAbUfssRM59lqxbXeh5W5oCrYHO");

    // The app's code is its configuration - shout out to suckless.org folks
    const FIVE_MIN = 300;
    const launchConfig: LaunchConfigV2 = {
        minTonForSaleSuccess: toNano("2"),
        tonLimitForWlRound: toNano("2"),
        penny: toNano("0.1"),

        utilJetMasterAddress: Address.parse("kQCRJ_NbvPCMGVIXRVU7KV8sZDmeX99uzumaAr7L5ZOMTIQz"),
        utilJetWlPassAmount: jettonToNano(10),
        utilJetWlPassOneTimePrice: jettonToNano(2),

        jetWlLimitPct: toPct(25),
        jetPubLimitPct: toPct(25),
        jetDexSharePct: toPct(25),

        creatorRoundDurationSec: FIVE_MIN,
        wlRoundDurationSec: FIVE_MIN,
        pubRoundDurationSec: FIVE_MIN,
    };
    const core = provider.open(
        CoreV2.createFromState(
            {
                chief,
                launchConfig,
                contracts: {
                    tokenLaunch: tokenLaunchCode,
                    userVault: userVaultCode,
                    jettonMaster: jettonMasterCode,
                    jettonWallet: jettonWalletCode
                }
            },
            coreCode
        )
    );
    ui.write(`Expected core address: ${core.address}`);
    await core.sendDeploy({ via: provider.sender(), value: toNano("2") });
    ui.write("Transaction sent");

}
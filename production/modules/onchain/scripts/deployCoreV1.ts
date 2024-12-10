import { LaunchConfigV1, toPct } from "starton-periphery";
import { compile, NetworkProvider } from "@ton/blueprint";
import { CoreV1 } from "../wrappers/CoreV1";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const coreCode = await compile("CoreV1");
    const tokenLaunchCode = await compile("TokenLaunchV1");
    const userVaultCode = await compile("UserVaultV1");
    const jettonMasterCode = await compile("JettonMaster");
    const jettonWalletCode = await compile("JettonWallet");

    const chief = Address.parse("0QCkmYN_RSz4qhhHEV3ralAbUfssRM59lqxbXeh5W5oCrYHO");

    // The app's code is its configuration - shout out to suckless.org folks
    const launchConfig: LaunchConfigV1 = {
        minTonForSaleSuccess: toNano("4"),
        tonLimitForWlRound: toNano("20"),
        penny: toNano("0.1"),

        jetWlLimitPct: toPct(18),
        jetPubLimitPct: toPct(38),
        jetDexSharePct: toPct(20),

        creatorRoundDurationSec: 300,
        wlRoundDurationSec: 360,
        pubRoundDurationSec: 360,
    };
    const core = provider.open(
        CoreV1.createFromState(
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
    await core.sendDeploy({ via: provider.sender(), value: toNano("1") });
    ui.write("Transaction sent");

}
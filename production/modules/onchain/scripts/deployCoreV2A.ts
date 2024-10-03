import { LaunchConfigV2A, toPct } from "starton-periphery";
import { compile, NetworkProvider } from "@ton/blueprint";
import { CoreV2A } from "../wrappers/CoreV2A";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const coreCode = await compile("CoreV2A");
    const tokenLaunchCode = await compile("TokenLaunchV2A");
    const userVaultCode = await compile("UserVaultV2A");
    const jettonMasterCode = await compile("JettonMaster");
    const jettonWalletCode = await compile("JettonWallet");

    const chief = Address.parse("0QCkmYN_RSz4qhhHEV3ralAbUfssRM59lqxbXeh5W5oCrYHO");

    // The app's code is its configuration - shout out to suckless.org folks
    try {
        const FIVE_MIN = 300;
        const launchConfig: LaunchConfigV2A = {
            minTonForSaleSuccess: toNano("4"),
            tonLimitForWlRound: toNano("4"),
            penny: toNano("0.5"),

            jetWlLimitPct: toPct(25),
            jetPubLimitPct: toPct(25),
            jetDexSharePct: toPct(25),

            creatorRoundDurationMs: FIVE_MIN,
            wlRoundDurationMs: FIVE_MIN,
            pubRoundDurationMs: FIVE_MIN,
        };
        const core = provider.open(
            CoreV2A.createFromState(
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
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
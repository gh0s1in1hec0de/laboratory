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

    const chief = Address.parse("fill in");

    // The app's code is its configuration - shout out to suckless.org folks
    try {
        const ONE_HOUR_SEC = 3600;
        const launchConfig: LaunchConfigV2A = {
            minTonForSaleSuccess: toNano("10"),
            tonLimitForWlRound: toNano("10"),
            penny: toNano("1"),

            jetWlLimitPct: toPct(30),
            jetPubLimitPct: toPct(30),
            jetDexSharePct: toPct(25),

            creatorRoundDurationMs: ONE_HOUR_SEC,
            wlRoundDurationMs: ONE_HOUR_SEC,
            pubRoundDurationMs: ONE_HOUR_SEC,
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
        await core.sendDeploy({ via: provider.sender(), value: toNano("amount to attach") });
        ui.write("Transaction sent");
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
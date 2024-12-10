import { logger } from "./logger";
import type { LaunchTradingStats, UserAction, } from "starton-periphery";

export enum LaunchTrend {
    Bullish = "bullish",
    Bearish = "bearish",
}

export function analyzeLaunchTrend(
    userActions: UserAction[]
): LaunchTradingStats | undefined {
    if (!userActions.length) return undefined;

    const { totalBuys, totalSells } = userActions.reduce(
        (totals, action) => {
            switch (action.actionType) {
                case "whitelist_buy":
                    totals.totalBuys += BigInt(action.whitelistTons);
                    break;
                case "public_buy":
                    totals.totalBuys += BigInt(action.publicTons);
                    break;
                case "whitelist_refund":
                    totals.totalSells += BigInt(action.whitelistTons);
                    break;
                case "public_refund":
                    totals.totalSells += BigInt(action.publicTons);
                    break;
                case "total_refund":
                    totals.totalSells += BigInt(action.whitelistTons) + BigInt(action.publicTons);
                    break;
            }
            return totals;
        },
        { totalBuys: BigInt(0), totalSells: BigInt(0) }
    );
    const delta = totalBuys - totalSells;
    return { trend: delta > 0n ? LaunchTrend.Bullish : LaunchTrend.Bearish, delta };
}

export function greeting() {
    console.log(`
     .-')   .-') _     ('-.    _  .-')  .-') _                   .-') _  
    ( OO ).(  OO) )   ( OO ).-( \\( -O )(  OO) )                 ( OO ) ) 
   (_)---\\_/     '._  / . --. /,------./     '._ .-'),-----.,--./ ,--,'  
   /    _ ||'--...__) | \\-.  \\ |   /\`. |'--...__( OO'  .-.  |   \\ |  |\\  
   \\  :\` \`.'--.  .--.-'-'  |  ||  /  | '--.  .--/   |  | |  |    \\|  | ) 
    '..\`''.)  |  |   \\| |_.'  ||  |_.' |  |  |  \\_) |  |\\|  |  .     |/  
   .-._)   \\  |  |    |  .-.  ||  .  '.'  |  |    \\ |  | |  |  |\\    |   
   \\       /  |  |    |  | |  ||  |\\  \\   |  |     \`'  '-'  |  | \\   |   
    \`-----'   \`--'    \`--' \`--'\`--' '--'  \`--'       \`-----'\`--'  \`--'   
                                                     by gh0s1in1hec0de
 `);
}

export async function _maybeBruteforceOverload<T>(
    operation: Promise<T> | T,
    retries = 4,
    maxDelay = 12000
): Promise<T> {
    let attempt = 1;
    let delay = 5000;
    while (attempt < retries) {
        const randomDelay = Math.floor(Math.random() * 1000);
        const waitTime = Math.min(delay + randomDelay, maxDelay);
        try {
            return await operation;
        } catch (e) {
            logger().error(`operation sucked (attempt #${attempt}) with error: `, e);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay = Math.min(delay * 2, maxDelay);
        attempt += 1;
    }
    throw new Error(`operation TOTALLY SUCKED (${attempt} attempts)`);
}

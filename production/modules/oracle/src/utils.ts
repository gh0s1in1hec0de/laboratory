import { logger } from "./logger";

export enum Network {
    Mainnet = "mainnet",
    Testnet = "testnet"
}

export async function maybeBruteforceOverload<T>(
    operation: Promise<T> | T,
    retries = 4,
    maxDelay = 3350
): Promise<T> {
    let attempt = 1;
    let delay = 750;
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
export function delay(sec: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
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
import type {ParseArgsConfig} from "util";

export type Coins = bigint;
// The raw address string format is chosen to standardize the stored addresses.
// It will help to avoid errors based on addresses' formats.
export type RawAddressString = string;

export const parseArgsConfig = (args: string[]): ParseArgsConfig => ({
    args,
    options: {
        debug: { type: 'boolean' },
        fresh: { type: 'boolean' },
        height: { type: 'string' },
    },
    strict: true,
    allowPositionals: true,
});

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
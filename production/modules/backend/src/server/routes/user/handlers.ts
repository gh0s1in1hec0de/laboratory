import { logger } from "../../../logger";

export async function getGreeting() {
    const logger = logger();

    try {
        return "Hello from user routes!";
    } catch (e){
        logger.http(`function retrieval error: ${e}`);
    }
}
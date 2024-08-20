import { useLogger } from "../../../logger";

export async function getGreeting() {
    const logger = useLogger();

    try {
        return "Hello from user routes!";
    } catch (e){
        logger.http(`function retrieval error: ${e}`);
    }
}
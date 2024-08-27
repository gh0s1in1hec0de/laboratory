import { logger } from "../../../logger";

export async function getGreeting() {
    try {
        return "Hello from user routes!";
    } catch (e){
        logger().http(`function retrieval error: ${e}`);
    }
}
import { logger } from "../../../logger";

export async function getGreeting() {
    try {
        return "hello from user routes!";
    } catch (e){
        logger().error(`function retrieval error: ${e}`);
    }
}
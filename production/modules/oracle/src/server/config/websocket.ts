import { logger } from "../../logger";
import Elysia, { t } from "elysia";

export function WebSocket() {
    return new Elysia()
        .ws("/ws", {
            query: t.Object({
                tgId: t.String(),
                address: t.String(),
                topicName: t.String()
            }),
            open(ws) {
                // TODO probably send it through headers
                const { address, tgId, topicName } = ws.data.query;
        
                // TODO refactor with tg id
                // const user = db.getUserByAddress(address);
                // if (!user) {
                //     logger().warn(`Client with ${tgId} not found!`);
                //     return;
                // }
        
                ws.subscribe(`${topicName}`);
                logger().info(`Client connected: ${address}`);
            },
            close(ws) {
                const { address, topicName } = ws.data.query;
        
                logger().info(`Client disconnected: ${address}`);
                ws.unsubscribe(`${topicName}`);
            }
        });
}

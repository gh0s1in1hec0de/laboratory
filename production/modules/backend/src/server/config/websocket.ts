import { logger } from "../../logger";
import Elysia, { t } from "elysia";

export function WebSocket() {
    return new Elysia()
        .ws("/ws", {
            query: t.Object({
                address: t.String(),
                tgId: t.String(),
                tokenAddress: t.String()
            }),
            open(ws) {
                // TODO probably send it through headers
                const { address, tgId, tokenAddress } = ws.data.query;
        
                // TODO refactor with tg id
                // const user = db.getUserByAddress(address);
                // if (!user) {
                //     logger().warn(`Client with ${tgId} not found!`);
                //     return;
                // }
        
                ws.subscribe(`${tokenAddress}`);
                logger().info(`Client connected: ${address}`);
            },
            close(ws) {
                const { address, tokenAddress } = ws.data.query;
        
                logger().info(`Client disconnected: ${address}`);
                ws.unsubscribe(`${tokenAddress}`);
            }
        });
}

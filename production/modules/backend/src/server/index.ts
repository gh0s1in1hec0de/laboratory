import { getSwaggerConfig, WebSocket } from "./config";
import { swagger } from "@elysiajs/swagger";
import { getConfig } from "../config.ts";
import { logger } from "../logger.ts";
import { UserRoutes } from "./routes";
import Elysia from "elysia";

function createServer() {
    const { 
        server: {
            swagger: { title, version },
            port 
        } 
    } = getConfig();
  
    return new Elysia({ prefix: "/api" })
        .use(swagger(getSwaggerConfig({
            title: title,
            version: version
        })))
        .use(WebSocket())
        .use(UserRoutes())
        .onError((err) => {
            logger().error(err);
        })
        .listen(port);
}

type ElysiaAPI = ReturnType<typeof createServer>;
let maybeServer: ElysiaAPI | null;

export function getServer(): ElysiaAPI {
    if (!maybeServer) {
        maybeServer = createServer();
    }
    return maybeServer;
}

export function sendMessageToWsClient(userAddress: string, tokenAddress: string, message: string) {
    if (!maybeServer) {
        logger().error("server is not created!");
        return;
    }
  
    const msg = {
        userAddress,
        text: message
    };
  
    maybeServer.server?.publish(`${tokenAddress}`, JSON.stringify(msg));
}
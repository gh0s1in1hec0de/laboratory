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
      logger().info(`elysia server is running at ${maybeServer.server?.hostname}:${maybeServer.server?.port}`);
      logger().info(`swagger docs are available at http://${maybeServer.server?.hostname}:${maybeServer.server?.port}/api/swagger`);
    }
    return maybeServer;
}

export function sendMessageToWsClient(topicName: string, message: string[]) {
    // hash of op, query_id (milisec) and sender_address
    getServer().server?.publish(`${topicName}`, JSON.stringify(message));
}
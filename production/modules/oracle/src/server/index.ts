import { TokenLaunchRoutes, UserRoutes } from "./routes";
import { getSwaggerConfig, WebSocket } from "./config";
import { swagger } from "@elysiajs/swagger";
import { AppMode } from "starton-periphery";
import { ok as assert } from "node:assert";
import { getConfig } from "../config";
import { logger } from "../logger";
import cors from "@elysiajs/cors";
import Elysia from "elysia";

function createServer() {
    const {
        mode,
        server: {
            swagger: { title, version },
            port,
            frontend_url
        }
    } = getConfig();

    const res = new Elysia({ prefix: "/api" })
        .use(swagger(getSwaggerConfig({
            title: title,
            version: version
        })))
        .use(cors(mode === AppMode.PROD ? { origin: frontend_url } : {}))
        .use(WebSocket())
        .use(UserRoutes())
        .use(TokenLaunchRoutes())
        .onError((err) => {
            logger().error(err);
        })
        // .mapResponse(({ response }) => {
        //     console.log("Logging response: ");
        //     console.log(response);
        //     if (typeof response === "object") {
        //         return JSON.stringify(response, (key, val) =>
        //             typeof val === "bigint" ? val.toString() : val
        //         );
        //     }
        // })
        .listen(port);
    assert(res.server, "caught dat bitch");
    return res;
}

type ElysiaAPI = ReturnType<typeof createServer>;
let maybeServer: ElysiaAPI | null;

export function startServer(): ElysiaAPI {
    if (!maybeServer) {
        maybeServer = createServer();
        logger().info(`elysia server is running at ${maybeServer.server!.hostname}:${maybeServer.server!.port}`);
        logger().info(`swagger docs are available at http://${maybeServer.server!.hostname}:${maybeServer.server!.port}/api/swagger`);
    }
    return maybeServer;
}

export function sendMessageToWsClient(topicName: string, message: string[]) {
    // SHA256(`${op(hexadecimal)${queryId}${senderAddress(RawString)}`)[]
    startServer().server!.publish(`${topicName}`, JSON.stringify(message));
}
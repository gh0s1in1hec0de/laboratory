import { UserRoutes } from "./routes";
import { getSwaggerConfig } from "./config";
import { swagger } from "@elysiajs/swagger";
import { ok as assert } from "node:assert";
import { getConfig } from "../config";
import { logger } from "../logger";
import Elysia from "elysia";
import cors from "@elysiajs/cors";

function createServer() {
    const {
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
        .use(cors({ origin: frontend_url }))
        .use(cors())
        .use(UserRoutes())
        .onError(err => logger().error("Error in Elysia: ", err))
        .listen(port);
    assert(res.server, "caught dat bitch");
    return res;
}

type ElysiaAPI = ReturnType<typeof createServer>;
let maybeServer: ElysiaAPI | null;

export function getServer(): ElysiaAPI {
    if (!maybeServer) {
        maybeServer = createServer();
        logger().info(`elysia server is running at ${maybeServer.server!.hostname}:${maybeServer.server!.port}`);
        logger().info(`swagger docs are available at http://${maybeServer.server!.hostname}:${maybeServer.server!.port}/api/swagger`);
    }
    return maybeServer;
}
import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { uploadMetadataToIpfs } from "./handlers";
import { UploadMetaSchema } from "./types";
import { authMiddleware } from "../auth";
import Elysia from "elysia";
import { logger } from "../../../logger.ts";

export function LaunchRoutes() {
    return new Elysia({ prefix: "/launch" })
        .onBeforeHandle(authMiddleware)
        .post(
            "/upload-meta",
            async ({ body, error }) => {
                try {
                    return await uploadMetadataToIpfs(body);
                } catch (e) {
                    logger().error("error occured in upload-metadata route call: ", e);
                    console.error(e);
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: UploadMetaSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );
}

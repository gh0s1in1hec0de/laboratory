import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { uploadMetadataToIpfs } from "./handlers";
import { UploadMetaSchema } from "./types";
import Elysia from "elysia";

export function UserRoutes() {
    return new Elysia({ prefix: "/launch" })
        .post(
            "/upload-meta",
            async ({ body, error }) => {
                try {
                    return await uploadMetadataToIpfs(body);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: UploadMetaSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        );
}

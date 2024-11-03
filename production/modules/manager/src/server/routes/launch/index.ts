import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { buyWhitelist, uploadMetadataToIpfs } from "./handlers";
import { BuyWhitelist, UploadMetaSchema } from "./types";
import { CommonServerError } from "starton-periphery";
import { authMiddleware } from "../auth";
import Elysia from "elysia";

export function LaunchRoutes() {
    return new Elysia({ prefix: "/launch" })
        .onBeforeHandle(authMiddleware)
        .post(
            "/upload-meta",
            async ({ body, error }) => {
                try {
                    return await uploadMetadataToIpfs({
                        ...body,
                        influencerSupport: body.influencerSupport === "true" ? true : body.influencerSupport === "false" ? false : undefined
                    });
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: UploadMetaSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        )
        .post(
            "/buy-wl",
            async ({ body, error }) => {
                try {
                    return await buyWhitelist(body);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: BuyWhitelist,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );

}

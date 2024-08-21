import {
    type DetailsForEndpoint,
    type SwaggerDocsConfigProps,
    type SwaggerDocsConfig,
    SwaggerTags,
    type SwaggerTagObject
} from "./types.ts";

const allSwaggerTags: Record<SwaggerTags, SwaggerTagObject> = {
    [SwaggerTags.User]: {
        name: SwaggerTags.User,
        description: "Endpoints for User data",
    },
    [SwaggerTags.Test]: {
        name: SwaggerTags.Test,
        description: "Endpoints for Test data"
    },
};

export function getSwaggerDocsConfig({ title, version }: SwaggerDocsConfigProps): SwaggerDocsConfig {
    return {
        info: {
            title,
            version,
        },
        tags: Object.values(allSwaggerTags)
    };
}

export function createDetailsForEndpoint(tag: SwaggerTags): DetailsForEndpoint {
    return {
        detail: {
            tags: [tag]
        }
    };
}

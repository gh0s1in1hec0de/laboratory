import type { ElysiaSwaggerConfig } from "@elysiajs/swagger/types";
import { OpenAPIV3 } from "openapi-types";

export enum SwaggerTags {
  User = "User",
  TokenLaunch = "Token Launch",
}

type SwaggerTagObject = {
  name: SwaggerTags,
  description?: string,
  externalDocs?: OpenAPIV3.ExternalDocumentationObject,
};

type DetailsForEndpoint = {
  detail: {
    tags: SwaggerTags[],
  },
}

type SwaggerDocsConfigProps = {
  title: string,
  version: string,
}

const allSwaggerTags: Record<SwaggerTags, SwaggerTagObject> = {
    [SwaggerTags.User]: {
        name: SwaggerTags.User,
        description: "Endpoints for User data",
    },
    [SwaggerTags.TokenLaunch]: {
        name: SwaggerTags.TokenLaunch,
        description: "Endpoints for Token Launch"
    },
};

export function getSwaggerConfig({ title, version }: SwaggerDocsConfigProps): ElysiaSwaggerConfig {
    return {
        documentation: {
            info: {
                title,
                version
            },
            tags: Object.values(allSwaggerTags)
        }
    };
}

export function createDetailsForEndpoint(tag: SwaggerTags): DetailsForEndpoint {
    return {
        detail: {
            tags: [tag]
        }
    };
}

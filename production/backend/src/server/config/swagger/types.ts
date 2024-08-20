import { OpenAPIV3 } from "openapi-types";

export type SwaggerDocsConfig = Omit<Partial<OpenAPIV3.Document>, "x-express-openapi-additional-middleware" | "x-express-openapi-validation-strict">;

export type SwaggerTagObject = {
  name: SwaggerTags,
  description?: string,
  externalDocs?: OpenAPIV3.ExternalDocumentationObject,
};

export type DetailsForEndpoint = {
  detail: {
    tags: SwaggerTags[],
  },
}

export type SwaggerDocsConfigProps = {
  title: string,
  version: string,
}

export enum SwaggerTags {
  User = "User",
  Test = "Test",
}
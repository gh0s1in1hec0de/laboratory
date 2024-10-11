import { t } from "elysia";

export const UploadMetaSchema = t.Object({
    links: t.Object({
        x: t.String(),
        telegram: t.String(),
        website: t.String(),
    }),
    image: t.String(),
    metadata: t.Object({
        uri: t.Optional(t.String()),
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        image: t.Optional(t.String()),
        image_data: t.Optional(t.String()),
        symbol: t.Optional(t.String()),
        decimals: t.Optional(t.String()),
        amount_style: t.Optional(t.String()),
    }),
});
import { t } from "elysia";

export const UploadMetaSchema = t.Object({
    links: t.Object({
        x: t.Optional(t.String()),
        telegram: t.Optional(t.String()),
        website: t.Optional(t.String()),
    }),
    image: t.Optional(t.String()),
    metadata: t.Object({
        name: t.String(),
        description: t.String(),
        symbol: t.String(),
        decimals: t.Optional(t.String()),
    }),
    influencerSupport: t.Optional(t.String())
});

export const BuyWhitelist = t.Object({
    callerAddress: t.String(),
    launchAddress: t.String(),
});
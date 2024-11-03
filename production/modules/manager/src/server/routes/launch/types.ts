import { t } from "elysia";

export const UploadMetaSchema = t.Object({
    links: t.Object({
        x: t.String(),
        telegram: t.String(),
        website: t.String(),
    }),
    image: t.String(),
    metadata: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        symbol: t.Optional(t.String()),
        decimals: t.Optional(t.String()),
    }),
    influencerSupport: t.Optional(t.String())
});

export const BuyWhitelist = t.Object({
    userAddress: t.String(),
    launchAddress: t.String(),
});
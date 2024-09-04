import { handleBotError, handleListTokensCommand, handleMenuCommand, handleStartCommand } from "./handlers";
import { commands, getAdminFilter, getMenuKeyboard, getMenuReply, getUnknownMsgReply } from "./constants";
import { hydrate, hydrateApi, type HydrateApiFlavor, type HydrateFlavor } from "@grammyjs/hydrate";
import { SortOrder, TokenLaunchFields } from "starton-periphery";
import { type EmojiFlavor, emojiParser } from "@grammyjs/emoji";
import type { StoredTokenLaunchRequest } from "../db";
import { Api, Bot, type Context } from "grammy";
import { getConfig } from "../config";
import { logger } from "../logger";

export type MyContext = EmojiFlavor<HydrateFlavor<Context>>;
type MyApi = HydrateApiFlavor<Api>;
let maybeBot: Bot<MyContext> | null;

export async function createBot(): Promise<Bot<MyContext>> {
    const {
        bot: {
            token
        }
    } = getConfig();

    maybeBot = new Bot<MyContext, MyApi>(token);

    maybeBot.use(emojiParser());
    maybeBot.use(hydrate());
    maybeBot.api.config.use(hydrateApi());

    await maybeBot.api.setMyCommands(commands);

    maybeBot.command("start", handleStartCommand);
    maybeBot.command("menu").filter(getAdminFilter, handleMenuCommand);

    const initSortData: StoredTokenLaunchRequest = {
        page: 1,
        limit: 10,
        sortBy: TokenLaunchFields.CREATED_AT,
        order: SortOrder.ASC,
        search: ""
    };

    let page = 1;

    maybeBot.callbackQuery("list", async (ctx) => {
        await handleListTokensCommand(ctx, {
            ...initSortData,
            page
        });
    });

    maybeBot.callbackQuery("add", async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply("In development");
    });

    maybeBot.callbackQuery(["next", "prev", "update"], async (ctx) => {
        await ctx.answerCallbackQuery();
        const newPage = ctx.callbackQuery.data == "next" ? page += 1
            : ctx.callbackQuery.data == "prev" ? page -= 1
                : page = 1;
        await handleListTokensCommand(ctx, {
            ...initSortData,
            page: newPage
        });
    });

    maybeBot.callbackQuery("back", async (ctx) => {
        const startText = getMenuReply(ctx);
        await ctx.callbackQuery.message!.editText(startText, {
            parse_mode: "HTML",
            reply_markup: getMenuKeyboard()
        });
        await ctx.answerCallbackQuery();
    });

    maybeBot.on("message", getUnknownMsgReply);

    maybeBot.catch(handleBotError);

    await maybeBot.start();

    return maybeBot;
}

export async function getBot(): Promise<Bot<MyContext>> {
    if (!maybeBot) {
        maybeBot = await createBot();
        logger().info("bot is running");
    }
    return maybeBot;
}
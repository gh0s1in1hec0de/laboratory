import { type Conversation, type ConversationFlavor, conversations, createConversation } from "@grammyjs/conversations";
import { hydrate, hydrateApi, type HydrateApiFlavor, type HydrateFlavor } from "@grammyjs/hydrate";
import { commands, Conversations, getAdminFilter, getUnknownMsgReply } from "./constants";
import { Api, Bot, type Context, session, type SessionFlavor } from "grammy";
import { getConfig } from "../config";
import { logger } from "../logger";
import {
    handlePaginationCallback,
    addWalletsToRelations,
    handleListCallback,
    handleStartCommand,
    handleMenuCommand,
    handleBotError,
    handleEnterConversationCallback,
    handleCancelConversationCallback,
    handleBackToMenuCallback,
    createTask
} from "./handlers";

interface SessionData {
    page: number,
}

export type MyContext = HydrateFlavor<Context> & ConversationFlavor & SessionFlavor<SessionData>;
type MyApi = HydrateApiFlavor<Api>;
export type MyConversation = Conversation<MyContext>;

let maybeBot: Bot<MyContext> | null;

export async function createBot(): Promise<Bot<MyContext>> {
    const {
        bot: {
            token
        }
    } = getConfig();

    maybeBot = new Bot<MyContext, MyApi>(token);

    function initial(): SessionData {
        return { page: 1 };
    }

    maybeBot.use(session({ initial }));
    maybeBot.use(conversations());
    maybeBot.use(createConversation(addWalletsToRelations));
    maybeBot.use(createConversation(createTask));
    maybeBot.use(hydrate());
    maybeBot.api.config.use(hydrateApi());

    await maybeBot.api.setMyCommands(commands);

    maybeBot.command("start", handleStartCommand);
    maybeBot.command("menu").filter(getAdminFilter, handleMenuCommand);

    maybeBot.callbackQuery("list_launches", handleListCallback);
    maybeBot.callbackQuery(["next", "prev", "reset_list"], handlePaginationCallback);

    maybeBot.callbackQuery("add_wallets", (ctx) => handleEnterConversationCallback(ctx, Conversations.addWallets));
    maybeBot.callbackQuery("cancel_conv", (ctx) => handleCancelConversationCallback(ctx, Conversations.addWallets));

    maybeBot.callbackQuery("add_task", (ctx) => handleEnterConversationCallback(ctx, Conversations.createTask));
    maybeBot.callbackQuery("cancel_conv", (ctx) => handleCancelConversationCallback(ctx, Conversations.createTask));

    maybeBot.callbackQuery("back", handleBackToMenuCallback);

    maybeBot.callbackQuery("nothing", async (ctx) => await ctx.answerCallbackQuery());

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
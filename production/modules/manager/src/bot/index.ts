import { type Conversation, type ConversationFlavor, conversations, createConversation } from "@grammyjs/conversations";
import { hydrate, hydrateApi, type HydrateApiFlavor, type HydrateFlavor } from "@grammyjs/hydrate";
import { commands, Conversations, getAdminFilter, getUnknownMsgReply } from "./constants";
import { Api, Bot, type Context, session, type SessionFlavor } from "grammy";
import { getConfig } from "../config";
import { logger } from "../logger";
import {
    handleCancelConversationCallback,
    handleLaunchesPaginationCallback,
    handleEnterConversationCallback,
    handleTasksPaginationCallback,
    handleListLaunchesCallback,
    handleBackToMenuCallback,
    handleListTasksCallback,
    addWalletsToRelations,
    handleStartCommand,
    handleMenuCommand,
    addRewardJetton,
    handleBotError,
    createTask,
    deleteTask,
} from "./handlers";
import {
    handleListRewardJettonsCallback,
    handleRewardJettonsPaginationCallback
} from "./handlers/listRewardJettons.ts";

interface SessionData {
    launchesPage: number,
    tasksPage: number,
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
        return { launchesPage: 1, tasksPage: 1 };
    }

    maybeBot.use(session({ initial }));
    maybeBot.use(conversations());
    maybeBot.use(createConversation(addWalletsToRelations));
    maybeBot.use(createConversation(addRewardJetton));
    maybeBot.use(createConversation(createTask));
    maybeBot.use(createConversation(deleteTask));
    maybeBot.use(hydrate());
    maybeBot.api.config.use(hydrateApi());

    await maybeBot.api.setMyCommands(commands);

    maybeBot.command("start", handleStartCommand);
    maybeBot.command("menu").filter(getAdminFilter, handleMenuCommand);

    maybeBot.callbackQuery("list_launches", handleListLaunchesCallback);
    maybeBot.callbackQuery(["next_launches", "prev_launches", "reset_launches"], handleLaunchesPaginationCallback);

    maybeBot.callbackQuery("list_tasks", handleListTasksCallback);
    maybeBot.callbackQuery(["next_tasks", "prev_tasks", "reset_tasks"], handleTasksPaginationCallback);

    maybeBot.callbackQuery("list_reward_jettons", handleListRewardJettonsCallback);
    maybeBot.callbackQuery(["next_reward_jettons", "prev_reward_jettons", "reset_reward_jettons"], handleRewardJettonsPaginationCallback);

    maybeBot.callbackQuery("add_wallets", (ctx) => handleEnterConversationCallback(ctx, Conversations.addWallets));
    maybeBot.callbackQuery("cancel_conv_add_wallets", (ctx) => handleCancelConversationCallback(ctx, Conversations.addWallets));

    maybeBot.callbackQuery("create_task", (ctx) => handleEnterConversationCallback(ctx, Conversations.createTask));
    maybeBot.callbackQuery("cancel_conv_create_task", (ctx) => handleCancelConversationCallback(ctx, Conversations.createTask));

    maybeBot.callbackQuery("delete_task", (ctx) => handleEnterConversationCallback(ctx, Conversations.deleteTask));
    maybeBot.callbackQuery("cancel_conv_delete_task", (ctx) => handleCancelConversationCallback(ctx, Conversations.deleteTask));

    maybeBot.callbackQuery("add_reward_jettons", (ctx) => handleEnterConversationCallback(ctx, Conversations.addRewardJetton));
    maybeBot.callbackQuery("cancel_conv_add_reward_jettons", (ctx) => handleCancelConversationCallback(ctx, Conversations.addRewardJetton));

    maybeBot.callbackQuery("back", handleBackToMenuCallback);

    maybeBot.callbackQuery("nothing", async (ctx) => await ctx.answerCallbackQuery());

    maybeBot.on("message", getUnknownMsgReply);

    maybeBot.catch(handleBotError);

    logger().info("bot is running");

    await maybeBot.start();

    return maybeBot;
}

export async function startBot(): Promise<Bot<MyContext>> {
    if (!maybeBot) {
        maybeBot = await createBot();
    }
    return maybeBot;
}
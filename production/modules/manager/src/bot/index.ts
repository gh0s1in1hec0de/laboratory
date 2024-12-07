import { type Conversation, type ConversationFlavor, conversations, createConversation } from "@grammyjs/conversations";
import { hydrate, hydrateApi, type HydrateApiFlavor, type HydrateFlavor } from "@grammyjs/hydrate";
import { commands, Conversations, getAdminFilter, getUnknownMsgReply } from "./constants";
import { Api, Bot, type Context, session, type SessionFlavor } from "grammy";
import { type RawAddressString, toSnakeCase } from "starton-periphery";
import { getConfig } from "../config";
import { logger } from "../logger";
import {
    handleRewardJettonsPaginationCallback,
    handleRewardPoolsPaginationCallback,
    handleListRewardJettonsCallback,
    handleCancelConversationCallback,
    handleLaunchesPaginationCallback,
    handleEnterConversationCallback,
    handleTasksPaginationCallback,
    handleListLaunchesCallback,
    handleBackToMenuCallback,
    handleListTasksCallback,
    listRewardPoolsPrelude,
    setTasksCompletions,
    handleStartCommand,
    handleMenuCommand,
    setRewardJetton,
    handleBotError,
    setRewardPool,
    createTask,
    deleteTask,
    setTicketsToUsers
} from "./handlers";

export type SessionData = {
    launchesPage: number,
    tasksPage: number,
    launchAddress: RawAddressString | null,
};

export type MyContext = HydrateFlavor<Context> & ConversationFlavor & SessionFlavor<SessionData>;
type MyApi = HydrateApiFlavor<Api>;
export type MyConversation = Conversation<MyContext>;

let maybeBot: Bot<MyContext> | null;

export async function createBot(): Promise<Bot<MyContext>> {
    const { bot: { token } } = getConfig();

    maybeBot = new Bot<MyContext, MyApi>(token);

    function initial(): SessionData {
        return { launchesPage: 1, tasksPage: 1, launchAddress: null };
    }

    maybeBot.use(session({ initial }));
    maybeBot.use(conversations());
    maybeBot.use(createConversation(listRewardPoolsPrelude));
    maybeBot.use(createConversation(setTasksCompletions));
    maybeBot.use(createConversation(setTicketsToUsers));
    maybeBot.use(createConversation(setRewardJetton));
    maybeBot.use(createConversation(setRewardPool));
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

    maybeBot.callbackQuery(["next_reward_pools", "prev_reward_pools", "reset_reward_pools"], handleRewardPoolsPaginationCallback);


    for (const conversation of Object.values(Conversations)) {
        maybeBot.callbackQuery(toSnakeCase(conversation), (ctx) => handleEnterConversationCallback(ctx, conversation));
        maybeBot.callbackQuery(`cancel_conv_${toSnakeCase(conversation)}`, (ctx) => handleCancelConversationCallback(ctx, conversation));
    }

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
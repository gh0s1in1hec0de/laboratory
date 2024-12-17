import { type Conversation, type ConversationFlavor, conversations, createConversation } from "@grammyjs/conversations";
import { hydrate, hydrateApi, type HydrateApiFlavor, type HydrateFlavor } from "@grammyjs/hydrate";
import { commands, Conversations, getAdminFilter, getUnknownMsgReply } from "./constants";
import { Api, Bot, type Context, InlineKeyboard, session, type SessionFlavor } from "grammy";
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

export type BaseContext = HydrateFlavor<Context> & ConversationFlavor;
export type ManagerContext = BaseContext & SessionFlavor<SessionData>;
type MyApi = HydrateApiFlavor<Api>;
export type MyConversation = Conversation<ManagerContext>;

let maybeManagerBot: Bot<ManagerContext> | null;
let maybeMainBot: Bot<BaseContext> | null;

export async function createBot(): Promise<Bot<ManagerContext>> {
    const { bot: { manager_token: token } } = getConfig();

    maybeManagerBot = new Bot<ManagerContext, MyApi>(token);

    function initial(): SessionData {
        return { launchesPage: 1, tasksPage: 1, launchAddress: null };
    }

    maybeManagerBot.use(session({ initial }));
    maybeManagerBot.use(conversations());
    maybeManagerBot.use(createConversation(listRewardPoolsPrelude));
    maybeManagerBot.use(createConversation(setTasksCompletions));
    maybeManagerBot.use(createConversation(setTicketsToUsers));
    maybeManagerBot.use(createConversation(setRewardJetton));
    maybeManagerBot.use(createConversation(setRewardPool));
    maybeManagerBot.use(createConversation(createTask));
    maybeManagerBot.use(createConversation(deleteTask));
    maybeManagerBot.use(hydrate());
    maybeManagerBot.api.config.use(hydrateApi());

    await maybeManagerBot.api.setMyCommands(commands);

    maybeManagerBot.command("start", handleStartCommand);
    maybeManagerBot.command("menu").filter(getAdminFilter, handleMenuCommand);

    maybeManagerBot.callbackQuery("list_launches", handleListLaunchesCallback);
    maybeManagerBot.callbackQuery(["next_launches", "prev_launches", "reset_launches"], handleLaunchesPaginationCallback);

    maybeManagerBot.callbackQuery("list_tasks", handleListTasksCallback);
    maybeManagerBot.callbackQuery(["next_tasks", "prev_tasks", "reset_tasks"], handleTasksPaginationCallback);

    maybeManagerBot.callbackQuery("list_reward_jettons", handleListRewardJettonsCallback);
    maybeManagerBot.callbackQuery(["next_reward_jettons", "prev_reward_jettons", "reset_reward_jettons"], handleRewardJettonsPaginationCallback);

    maybeManagerBot.callbackQuery(["next_reward_pools", "prev_reward_pools", "reset_reward_pools"], handleRewardPoolsPaginationCallback);


    for (const conversation of Object.values(Conversations)) {
        maybeManagerBot.callbackQuery(toSnakeCase(conversation), (ctx) => handleEnterConversationCallback(ctx, conversation));
        maybeManagerBot.callbackQuery(`cancel_conv_${toSnakeCase(conversation)}`, (ctx) => handleCancelConversationCallback(ctx, conversation));
    }

    maybeManagerBot.callbackQuery("back", handleBackToMenuCallback);
    maybeManagerBot.callbackQuery("nothing", async (ctx) => await ctx.answerCallbackQuery());

    maybeManagerBot.on("message", getUnknownMsgReply);

    maybeManagerBot.catch(handleBotError);

    logger().info("bot is running");

    await maybeManagerBot.start();

    return maybeManagerBot;
}

export async function startManagerBot(): Promise<Bot<ManagerContext>> {
    if (!maybeManagerBot) maybeManagerBot = await createBot();
    return maybeManagerBot;
}

// === Main bot draft === TODO: Finish this stuff
export async function createMainBot(): Promise<Bot<BaseContext>> {
    const {
        bot: { main_token: token },
    } = getConfig();

    maybeMainBot = new Bot<BaseContext, MyApi>(token);

    maybeMainBot.command("start", async ctx =>
        await ctx.replyWithPhoto("https://storage.starton.pro/ipfs/QmWkV4B7KKwLzrtZ1umqTt7bBoeQDY4aTLjqqqWuHHFAYC", {
            caption: "Welcome to StartON!\n\nAre you ready to join the new wave of launching tokens?\n\nJoin us now, it's still early!\n\nPress StartON to start!",
            reply_markup: new InlineKeyboard()
                .url("StartON", "https://t.me/start_onbot/StartON")
                .row()
                .url("Join StartON Channel", "https://t.me/starton_en")
        })
    );

    maybeMainBot.catch(e => logger().error("Main bot error: ", e));

    logger().info("Main bot is running");

    await maybeMainBot.start();
    return maybeMainBot;
}

export async function startMainBot(): Promise<Bot<BaseContext>> {
    if (!maybeMainBot) maybeMainBot = await createMainBot();
    return maybeMainBot;
}
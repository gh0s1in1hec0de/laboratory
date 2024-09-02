import { getAdminFilter, getUnknownMsgReply } from "./constants";
import { handleBotError, handleStartCommand } from "./handlers";
import { type EmojiFlavor, emojiParser } from "@grammyjs/emoji";
import { Bot, type Context } from "grammy";
import { commands } from "./commands";
import { getConfig } from "../config";
import { logger } from "../logger";

export type MyContext = EmojiFlavor<Context>;
let maybeBot: Bot<MyContext> | null;

export async function createBot(): Promise<Bot<MyContext>> {
    const {
        bot: {
            token
        }
    } = getConfig();
    
    if (maybeBot){
        await maybeBot.stop();
        logger().info("bot is stopped.");
    }
    
    maybeBot = new Bot<MyContext>(token);
    
    maybeBot.use(emojiParser());
    
    await maybeBot.api.setMyCommands(commands);
    maybeBot.command("start", handleStartCommand);
    maybeBot.command("list_tokens").filter(getAdminFilter, async (ctx) => {
        await ctx.reply("Hello, admin!");
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
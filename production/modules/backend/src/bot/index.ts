import {Bot, HttpError, GrammyError} from "grammy";
import {getConfig} from "../config";
import {logger} from "../logger";

const config = getConfig();

function createBot(): Bot {
  const bot: Bot = new Bot(config.bot.token);
  
  bot.api.setMyCommands([
    {
      command: "start",
      description: "start the bot"
    },
    {
      command: "hello",
      description: "get greetings"
    }
  ]);
  
  bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
  bot.command("hello", (ctx) => ctx.reply("Hello mutherfucker"));
  
  bot.on("message", (ctx) => ctx.reply("Got another message!"));
  
  bot.catch((err) => {
    const ctx = err.ctx;
    logger().warn(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      logger().error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      logger().error("Could not contact Telegram:", e);
    } else {
      logger().error("Unknown error:", e);
    }
  });
  
  return bot;
}


let maybeBot: Bot | null;

export function getBot(): Bot {
  if (!maybeBot) {
    maybeBot = createBot();
    logger().info("bot is running");
  }
  return maybeBot;
}
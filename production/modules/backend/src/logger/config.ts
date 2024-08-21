import { AppMode, getConfig } from "../config.ts";
import WinstonTelegram from "winston-telegram";
import winston, { type Logger } from "winston";
import "winston-daily-rotate-file";

const {
    printf,
    combine,
    timestamp,
    json,
    prettyPrint,
    colorize,
} = winston.format;

const {
    Console,
    DailyRotateFile
} = winston.transports;

type LogLevels = "error" | "warn" | "info" | "debug" | "http";

const logLevelsOrder: Record<LogLevels, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    http: 4,
};

const colors: Record<LogLevels, string> = {
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
    http: "magenta",
};

const customFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]:  ${message}`;
});

const format = combine(
    timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS"
    }),
    json(),
    prettyPrint(),
    customFormat
);

export function getLoggerConfig(): Logger {
    const { mode, logger } = getConfig();
    const { 
        dev_thread_id,
        prod_thread_id, 
        bot_token,
        chat_id 
    } = logger;
    const isDev = mode === AppMode.DEV;
    const levelBasedOnMod = isDev ? "http" : "error";

    return winston.createLogger({
        levels: logLevelsOrder,
        level: levelBasedOnMod,
        format: format,
        transports: [
            new Console({
                format: combine(
                    colorize({ all: true, colors }),
                    customFormat
                )
            }),
            new WinstonTelegram({
                token: bot_token,
                chatId: chat_id,
                level: levelBasedOnMod,
                messageThreadId: isDev ? dev_thread_id : prod_thread_id,
                disableNotification: true,
                // formatMessage: function (opts) {
                //     let message = opts.message;
                //
                //     if (opts.level === "warn") {
                //         message += "[Warning] ";
                //     }
                //     return message;
                // }
            }),
            ...(
                isDev ? [
                    new DailyRotateFile({
                        filename: "logs/dev/logs-%DATE%.log",
                        datePattern: "YYYY-MM-DD",
                        maxFiles: "10d",
                        level: "http",
                        format: format
                    }),
                ] : [
                    new DailyRotateFile({
                        filename: "logs/prod/errors-%DATE%.log",
                        datePattern: "YYYY-MM-DD",
                        maxFiles: "10d",
                        level: "error",
                        format: format
                    }),
                ]
            ),
        ]
    });
}
import winston, { type Logger } from "winston";
import { AppMode } from "starton-periphery";
import { getConfig } from "./config";
import "winston-daily-rotate-file";
import path from "path";

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

function configureLogger(): Logger {
    const { mode, logger } = getConfig();
    const {
        dev_thread_id,
        prod_thread_id,
        bot_token,
        chat_id
    } = logger;
    const isDev = mode === AppMode.DEV;
    const level = isDev ? "http" : "error";

    return winston.createLogger({
        levels: logLevelsOrder,
        level,
        format,
        transports: [
            new Console({
                format: combine(
                    colorize({ all: true, colors }),
                    customFormat
                )
            }),
            // Looks like we'll need to disable telegram logging because of following error
            //  Possible EventEmitter memory leak detected. 11 error listeners added to [Telegram]. Use emitter.setMaxListeners() to increase limit
            // new WinstonTelegram({
            //     token: bot_token,
            //     chatId: chat_id,
            //     level: "error",
            //     messageThreadId: isDev ? dev_thread_id : prod_thread_id,
            //     disableNotification: true,
            // }),
            new DailyRotateFile({
                filename: path.resolve(__dirname, `../../logs_oracle/logs_${isDev ? "dev" : "prod"}_%DATE%.log`),
                datePattern: "YYYY-MM-DD",
                maxFiles: "10d",
                level,
                format
            })
        ]
    });
}

let maybeLogger: Logger | null = null;

export function logger(): Logger {
    if (!maybeLogger) {
        console.log("configuring logger...");
        maybeLogger = configureLogger();
    }
    return maybeLogger;
}
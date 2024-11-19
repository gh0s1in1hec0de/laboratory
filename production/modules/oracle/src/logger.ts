import winston, { type Logger } from "winston";
import { getConfig } from "./config";
import "winston-daily-rotate-file";
import path from "path";

const { printf, combine, timestamp, json, prettyPrint, colorize, } = winston.format;
const { Console, DailyRotateFile } = winston.transports;

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
    const { mode } = getConfig();

    return winston.createLogger({
        levels: logLevelsOrder,
        level: "http",
        format,
        transports: [
            new Console({
                format: combine(
                    colorize({ all: true, colors }),
                    customFormat
                )
            }),
            new DailyRotateFile({
                filename: path.resolve(__dirname, `../../logs_oracle/logs_${mode}_%DATE%.log`),
                datePattern: "YYYY-MM-DD",
                maxFiles: "10d",
                level: "http",
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
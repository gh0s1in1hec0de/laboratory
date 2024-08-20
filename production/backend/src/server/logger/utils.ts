import "winston-daily-rotate-file";
import winston from "winston";

const { combine, timestamp, json, prettyPrint, printf, colorize } = winston.format;
const { File, Console, Stream, DailyRotateFile } = winston.transports;

const customFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${label} ${level}: ${message}`;
});

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    http: 4,
};

// const colors = {
//     error: "yellow",
//     warn: "red",
//     info: "red",
//     debug: "red",
//     http: "red",
// };

export function createAppLogger() {
    return winston.createLogger({
        levels: logLevels,
        // colors,
        level: "http",
        format: combine(
            timestamp({
                format: "YYYY-MM-DD HH:mm:ss.SSS"
            }),
            json(),
            prettyPrint(),
            colorize({ all: true }),
            customFormat
        ),
        transports: [
            new Console(),
            // new File({ filename: "logs/errors.log", level: "error" }),
            new DailyRotateFile({
                filename: "logs/errors/errors-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                maxFiles: "14d",
                level: "error",
            })
        ]
    });
}
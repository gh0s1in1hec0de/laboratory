import { getLoggerConfig } from "./config";
import { type Logger } from "winston";

let logger: Logger | null = null;

export function useLogger(): Logger {
    if (!logger) {
        logger = getLoggerConfig();
    }
    return logger;
}
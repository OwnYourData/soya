import { createLogger, format, transports } from 'winston';
import type { LoggerLike } from '../soya';

export let logger: LoggerLike = createLogger({
    level: 'debug', // TODO:
    format: format.json(),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple(),
            )
        })
    ]
}) as unknown as LoggerLike;

export const setLogger = (instance: LoggerLike): void => {
    logger = instance;
};
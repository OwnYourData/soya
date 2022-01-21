
import { createLogger, format, Logger, transports, } from 'winston';

export let logger = createLogger({
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
});

export const setLogger = (instance: Logger) => logger = instance;
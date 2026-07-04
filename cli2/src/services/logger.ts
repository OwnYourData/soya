
import { createLogger, format, transports, } from 'winston';
import { cmdArgs } from '../utils/cmd';

const getLogLevel = (): string => {
  switch ((cmdArgs.verbose ?? []).reduce((prev, curr) => curr === true ? prev + 1 : prev, 0)) {
    case 1: return 'warn';
    case 2: return 'info';
    case 3: return 'debug';
    case 4: return 'silly';
    default: return 'error';
  }
}

export const logger = createLogger({
  level: getLogLevel(),
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
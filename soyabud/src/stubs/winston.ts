/**
 * Browser stub for `winston`.
 *
 * soya-js uses winston for logging. winston is a node-only library
 * (it pulls in os/fs/streams), so for the browser bundle we replace
 * it with a thin console-based logger that implements the small
 * API surface soya-js actually uses.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LoggerLike {
  error: (...args: any[]) => any;
  warn: (...args: any[]) => any;
  info: (...args: any[]) => any;
  debug: (...args: any[]) => any;
  log: (...args: any[]) => any;
  child: (...args: any[]) => LoggerLike;
}

const makeLogger = (): LoggerLike => {
  const logger: LoggerLike = {
    error: (...args: any[]) => console.error(...args),
    warn: (...args: any[]) => console.warn(...args),
    info: (...args: any[]) => console.info(...args),
    // console.debug is hidden by default in most browsers,
    // which is just fine for soya-js' verbose debug output
    debug: (...args: any[]) => console.debug(...args),
    log: (...args: any[]) => console.log(...args),
    child: () => makeLogger(),
  };

  return logger;
};

// winston-compatible no-op "format" API
const noopFormat = () => ({});
export const format: any = Object.assign(noopFormat, {
  json: noopFormat,
  simple: noopFormat,
  colorize: noopFormat,
  combine: noopFormat,
  timestamp: noopFormat,
  printf: noopFormat,
  label: noopFormat,
});

export class Console {
  constructor(_options?: any) { /* noop */ }
}

export const transports = {
  Console,
};

export const createLogger = (_options?: any): LoggerLike => makeLogger();

export default {
  createLogger,
  format,
  transports,
};

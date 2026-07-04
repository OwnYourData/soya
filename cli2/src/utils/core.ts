import { logger } from "../services/logger"

export const exitWithError = (message: string): never => {
  logger.error(message);
  return process.exit(-1);
}
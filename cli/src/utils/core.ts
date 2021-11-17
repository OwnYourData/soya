import { logger } from "../services/logger"
import fs from 'fs/promises';
import findRoot from "find-root";
import path from "path";

export const exitWithError = (message: string): never => {
  logger.error(message);
  return process.exit(0);
}

export const makeTempDir = async (): Promise<[
  () => Promise<void>,
  string,
]> => {
  const tempPath = path.join(findRoot(__filename), 'temp');
  fs.mkdir(tempPath, { recursive: true });
  
  // why do we return an array here?
  // most probably the return value will be consumed with array destructuring, like:
  // [removeDir, path] = await makeTempDir()
  // by returning the method as the first array item we ensure
  // typescript will always complain if the method is not called
  // this way we can "ensure" the temporary directory is always removed after usage
  // let time show us if this was a clever idea :-)
  return [
    () => fs.rm(tempPath, { recursive: true }),
    tempPath
  ];
}

// escape whitespace in filenames
export const escapeFilename = (name: string) => name.replace(/\s/g, '\\ ');
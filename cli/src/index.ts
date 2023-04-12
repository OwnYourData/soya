#!/usr/bin/env node
import { systemCommands } from "./commands";
import { logger } from "./services/logger";
import { cmdArgs, printCliHelp } from "./utils/cmd";
import { packageJson } from "./utils/package";
import { RepoService, Soya, Overlays } from "soya-js";
import { exitWithError } from "./utils/core";
import { Std } from "./utils/std";

interface CommandObject {
  [key: string]: Overlays.OverlayPlugin,
}

const overlayPlugins: CommandObject = {
  'transform': new Overlays.SoyaTransform(),
  'validate': new Overlays.SoyaValidate(),
};

export const logNiceConsole = (value: any) => {
  let out = value;

  if (typeof value === 'object')
    out = JSON.stringify(value, undefined, 2);

  console.log(out);
}

(async () => {
  if (cmdArgs.version)
    return console.log(packageJson.version);

  if (!cmdArgs.default || (!cmdArgs.default && cmdArgs.help))
    return printCliHelp();

  const {
    repo,
    default: [command, ...rest],
  } = cmdArgs;
  const [param1] = rest;

  if (command && cmdArgs.help)
    return printCliHelp(command);

  logger.info(`${packageJson.name} (${packageJson.version})\n`);

  let repoService: RepoService | undefined = undefined
  if (repo) {
    logger.debug(`Using repo: ${repo}`);
    repoService = new RepoService(repo);
  }

  const soya = new Soya({
    service: repoService,
    logger,
  });

  // system commands
  if (command) {
    const func = systemCommands[command];

    if (func) {
      func({
        ...cmdArgs,
        default: rest,
        param1: param1,
      }, soya);
      return;
    }
  }

  if (!command)
    return exitWithError('No command specified!');

  const plugin = overlayPlugins[command];

  if (!plugin)
    return exitWithError(`No plugin available for command "${command}"!`);

  if (!param1)
    return exitWithError('No DRI specified!');

  let input: string | undefined = await Std.in();

  if (!input)
    return exitWithError('No input data specified!');

  const layer = await soya.pull(param1);

  let parsedInput: any;
  try {
    parsedInput = JSON.parse(input);
  } catch {
    logger.error('Input data is not valid JSON!')
    return;
  }

  logger.debug('Overlay:', layer);
  logger.debug('Data In:', parsedInput);

  let res: Overlays.OverlayResult;

  try {
    res = await plugin.run(layer, parsedInput, cmdArgs.executable);
  } catch (e: any) {
    logger.error(`Plugin "${command}" raised an error: ${e.message}`);
    return;
  }

  logger.debug('Data Out:', res);

  let output: any = res.data;
  try {
    logNiceConsole(output);
  } catch {
    console.log(output);
  }

  return;
})();
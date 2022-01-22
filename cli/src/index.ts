#!/usr/bin/env node
import { systemCommands } from "./commands";
import { logger } from "./services/logger";
import { cmdArgs, printCliHelp } from "./utils/cmd";
import { packageJson } from "./utils/package";
import { RepoService, Soya, Overlays } from "soya-js";
import { exitWithError } from "./utils/core";
import { Std } from "./utils/std";
import { SoyaTransform } from "./overlays/transform";

interface CommandObject {
  [key: string]: Overlays.OverlayPlugin,
}

const overlayPlugins: CommandObject = {
  'transform': new SoyaTransform(),
  'validate': new Overlays.SoyaValidate(),
};

export const logNiceJson = (json: any) => console.log(JSON.stringify(json, undefined, 2));

(async () => {
  if (cmdArgs.version)
    return console.log(packageJson.version);

  if (!cmdArgs.default || (!cmdArgs.default && cmdArgs.help))
    return printCliHelp();

  const {
    repo,
    default: [command, param1],
  } = cmdArgs;

  if (command && cmdArgs.help)
    return printCliHelp(command);

  logger.info(`${packageJson.name} (${packageJson.version})\n`);

  let repoService: RepoService | undefined = undefined
  if (repo)
    repoService = new RepoService(repo);

  const soya = new Soya({
    service: repoService,
    logger,
  });

  // system commands
  if (command) {
    const func = systemCommands[command];

    if (func) {
      func(soya, param1);
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
    res = await plugin.run(layer, parsedInput);
  } catch (e: any) {
    logger.error(`Plugin "${command}" raised an error: ${e.message}`);
    return;
  }

  logger.debug('Data Out:', res);

  let output: any = res.data;
  try {
    logNiceJson(output);
  } catch {
    console.log(output);
  }

  return;
})();
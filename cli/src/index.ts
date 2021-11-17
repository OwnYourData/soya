#!/usr/bin/env node

import { DEFAULT_SOYA_NAMESPACE, SoyaService } from "./services/soya";
import { cmdArgs, printCliHelp } from "./utils/cmd";
import { Std } from "./utils/std";
import { SoyaTransform } from "./overlays/transform";
import { CommandPlugin, OverlayResult } from "./overlays/interface";
import { logger } from "./services/logger";
import { SoyaValidate } from "./overlays/validate";
import { packageJson } from "./utils/package";
import { parseJsonLd } from "./utils/rdf";
import { calculateBaseUri } from "./utils/dri";
import DatasetExt from "rdf-ext/lib/Dataset";
import { exitWithError } from "./utils/core";
import { tryPrintTemplate } from "./system/template";
import { yaml2soya } from "./system/yaml2soya";

interface CommandObject {
  [key: string]: CommandPlugin,
}

const overlayPlugins: CommandObject = {
  'transform': new SoyaTransform(),
  'validate': new SoyaValidate(),
};

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

  const handleSystemCommands = async (): Promise<boolean> => {
    switch (command) {
      case 'template':
        if (!param1)
          return exitWithError('No template name specified!');

        tryPrintTemplate(param1);
        break;
      case 'init':
        const yamlContent = await Std.in();

        if (!yamlContent)
          return exitWithError('No YAML content provided via stdin!');

        const doc = await yaml2soya(yamlContent, DEFAULT_SOYA_NAMESPACE, SoyaService.getInstance().repo);
        console.log(JSON.stringify(doc, undefined, 2));
        break;
      case 'pull':
        if (!param1)
          return exitWithError('No path specified!');

        try {
          const pulledData = await SoyaService.getInstance().pull(param1);
          console.log(JSON.stringify(pulledData, undefined, 2));
        } catch (e: any) {
          logger.error('Could not fetch resource from repo!');

          if (typeof e.response.status === 'number') {
            logger.error(`Error: ${e.response.status} ${e.response.statusText}`);
          }
        }
        break;
      case 'push':
        const contentDocument = await Std.in();
        if (!contentDocument)
          return exitWithError('No content provided via stdin!');

        try {
          const item = await SoyaService.getInstance().push(contentDocument);
          logger.debug('Pushed item', item);
          console.log(item.dri);
        } catch {
          return exitWithError('Could not push SOyA document');
        }
        break;
      case 'calculate-dri':
        const content = await Std.in();

        if (!content)
          return exitWithError('No content provided via stdin!');

        let json: any;
        let quads: DatasetExt;

        logger.debug('Raw input:');
        logger.debug(content);

        try {
          json = JSON.parse(content);
          quads = await parseJsonLd(json);
        }
        catch {
          return exitWithError('Could not parse JSON!');
        }

        try {
          const result = await calculateBaseUri({
            json,
            quads,
          });

          console.log(result.dri);
        }
        catch {
          return exitWithError('Could not calculate DRI!');
        }

        break;
      case 'similar':
        try {
          const res = await SoyaService.getInstance().similar(await Std.in());
          console.log(JSON.stringify(res, undefined, 2));
        } catch (e) {
          console.error(e)
          return exitWithError('Could not process provided document');
        }
        break;
      case 'info':
        if (!param1)
          return exitWithError('No path specified!');

        try {
          const res = await SoyaService.getInstance().info(param1);
          console.log(JSON.stringify(res, undefined, 2));
        } catch {
          return exitWithError('Could not fetch SOyA info');
        }
        break;
      default:
        return false;
    }

    return true;
  }

  logger.info(`${packageJson.name} (${packageJson.version})\n`);

  if (repo)
    SoyaService.initialize(new SoyaService(repo));

  const isSupported = await handleSystemCommands();
  if (isSupported)
    return;

  let input: string | undefined = await Std.in();

  if (!input)
    return exitWithError('No input data specified!');

  if (!param1)
    return exitWithError('No DRI specified!');

  const layer = await SoyaService.getInstance().pull(param1);

  if (!command)
    return exitWithError('No command specified!');

  const plugin = overlayPlugins[command];

  if (!plugin)
    return exitWithError(`No plugin available for command "${command}"!`);

  let parsedInput: any;
  try {
    parsedInput = JSON.parse(input);
  } catch {
    logger.error('Input data is not valid JSON!')
    return;
  }

  logger.debug('Overlay:', layer);
  logger.debug('Data In:', parsedInput);

  let res: OverlayResult;

  try {
    res = await plugin.run(layer, parsedInput);
  } catch (e: any) {
    logger.error(`Plugin "${command}" raised an error: ${e.message}`);
    return;
  }

  logger.debug('Data Out:', res);

  let output: any = res.data;
  try {
    output = JSON.stringify(output, undefined, 2);
  } catch { }

  console.log(output);

  return;
})();
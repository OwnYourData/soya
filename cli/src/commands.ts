import { Soya, Errors } from "soya";
import { logNiceJson } from ".";
import { logger } from "./services/logger";
import { tryPrintTemplate } from "./system/template";
import { exitWithError } from "./utils/core";
import { Std } from "./utils/std";
import open from "open";

const acquire = async (soya: Soya, param1: any): Promise<void> => {
  if (!param1)
    return exitWithError('No soya structure specified!');

  const flatJsonContent = await Std.in();

  if (!flatJsonContent)
    return exitWithError('No JSON content provided via stdin!');

  try {
    logNiceJson(await soya.acquire(param1, flatJsonContent));
  } catch (e: any) {
    if (typeof e.response.status === 'number') {
      logger.error(`Error: ${e.response.status} ${e.response.statusText}`);
      return exitWithError('Could not fetch soya structure from repo!');
    }
    else {
      logger.error(`Error: ${e.toString()}`);
      return exitWithError('Could not transform flat JSON to JSON-LD!');
    }
  }
}
const template = async (_: Soya, param1: any): Promise<void> => {
  if (!param1)
    return exitWithError('No template name specified!');

  tryPrintTemplate(param1);
}
const init = async (soya: Soya): Promise<void> => {
  const yamlContent = await Std.in();

  if (!yamlContent)
    return exitWithError('No YAML content provided via stdin!');

  logNiceJson(await soya.init(yamlContent));
}
const pull = async (soya: Soya, param1: any): Promise<void> => {
  if (!param1)
    return exitWithError('No path specified!');

  try {
    logNiceJson(await soya.pull(param1));
  } catch (e: any) {
    logger.error('Could not fetch resource from repo!');

    if (typeof e.response.status === 'number') {
      logger.error(`Error: ${e.response.status} ${e.response.statusText}`);
    }
  }
}
const push = async (soya: Soya): Promise<void> => {
  const contentDocument = await Std.in();
  if (!contentDocument)
    return exitWithError('No content provided via stdin!');

  try {
    const item = await soya.push(contentDocument);
    logger.debug('Pushed item', item);
    console.log(item.dri);
  } catch (e: any) {
    if (typeof e.message === 'string')
      logger.error(e.message);

    return exitWithError('Could not push SOyA document');
  }
}
const calculateDri = async (soya: Soya): Promise<void> => {
  const content = await Std.in();

  if (!content)
    return exitWithError('No content provided via stdin!');

  try {
    const result = await soya.calculateDri(content);
    console.log(result.dri);
  } catch (e: any) {
    if (e instanceof Errors.JsonParseError)
      return exitWithError('Could not parse JSON!');

    return exitWithError('Could not calculate DRI!');
  }
}
const similar = async (soya: Soya): Promise<void> => {
  try {
    logNiceJson(await soya.similar(await Std.in()));
  } catch (e) {
    console.error(e)
    return exitWithError('Could not process provided document');
  }
}
const info = async (soya: Soya, param1: any): Promise<void> => {
  if (!param1)
    return exitWithError('No path specified!');

  try {
    logNiceJson(await soya.info(param1));
  } catch {
    return exitWithError('Could not fetch SOyA info');
  }
}
const playground = async (_: Soya): Promise<void> => {
  let queryParam: string;

  try {
    const input = await Std.in();

    if (!input)
      return exitWithError('No input JSON-LD specified!');

    queryParam = encodeURIComponent(input);
  } catch {
    return exitWithError('Could not URI encode JSON-LD!');
  }

  open(`https://json-ld.org/playground/#json-ld=${queryParam}`);
}

export const systemCommands: {
  [key: string]: (soya: Soya, ...params: any[]) => Promise<void>,
} = {
  acquire,
  template,
  init,
  pull,
  push,
  similar,
  info,
  playground,
  'calculate-dri': calculateDri,
};
import { Soya, Errors } from "soya-js";
import { logNiceConsole } from ".";
import { logger } from "./services/logger";
import { tryPrintTemplate } from "./system/template";
import { exitWithError } from "./utils/core";
import { Std } from "./utils/std";
import open from "open";

const acquire = async (params: any[], soya: Soya): Promise<void> => {
  const [param1] = params;
  if (!param1)
    return exitWithError('No soya structure specified!');

  const flatJsonContent = await Std.in();

  if (!flatJsonContent)
    return exitWithError('No JSON content provided via stdin!');

  let flatJson: any;
  try {
    flatJson = JSON.parse(flatJsonContent);
  } catch {
    throw new Errors.JsonParseError('Could not parse input as JSON!');
  }

  try {
    logNiceConsole(await soya.acquire(param1, flatJson));
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
const template = async (params: any[]): Promise<void> => {
  const [param1] = params;
  if (!param1)
    return exitWithError('No template name specified!');

  tryPrintTemplate(param1);
}
const init = async (_: any[], soya: Soya): Promise<void> => {
  const yamlContent = await Std.in();

  if (!yamlContent)
    return exitWithError('No YAML content provided via stdin!');

  logNiceConsole(await soya.init(yamlContent));
}
const pull = async (params: any[], soya: Soya): Promise<void> => {
  const [param1] = params;
  if (!param1)
    return exitWithError('No path specified!');

  try {
    logNiceConsole(await soya.pull(param1));
  } catch (e: any) {
    logger.error('Could not fetch resource from repo!');

    if (typeof e.response.status === 'number') {
      logger.error(`Error: ${e.response.status} ${e.response.statusText}`);
    }
  }
}
const push = async (_: any[], soya: Soya): Promise<void> => {
  const contentDocument = await Std.in();
  if (!contentDocument)
    return exitWithError('No content provided via stdin!');

  try {
    const res = await soya.push(contentDocument);
    logger.debug('Pushed item', res.item.content);
    logNiceConsole(res.value);
  } catch (e: any) {
    if (typeof e.message === 'string')
      logger.error(e.message);

    return exitWithError('Could not push SOyA document');
  }
}
const calculateDri = async (_: any[], soya: Soya): Promise<void> => {
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
const similar = async (_: any[], soya: Soya): Promise<void> => {
  try {
    logNiceConsole(await soya.similar(await Std.in()));
  } catch (e) {
    console.error(e)
    return exitWithError('Could not process provided document');
  }
}
const info = async (params: any[], soya: Soya): Promise<void> => {
  const [param1] = params;
  if (!param1)
    return exitWithError('No path specified!');

  try {
    logNiceConsole(await soya.info(param1));
  } catch {
    return exitWithError('Could not fetch SOyA info');
  }
}
const form = async (params: any[], soya: Soya): Promise<void> => {
  const [param1] = params;

  if (!param1)
    return exitWithError('No path specified!');

  try {
    logNiceConsole(await soya.getForm(param1));
  } catch {
    return exitWithError('Could not generate SOyA form!');
  }
}
const playground = async (): Promise<void> => {
  let queryParam: string;

  try {
    const input = await Std.in();

    if (!input)
      return exitWithError('No input JSON-LD specified!');

    queryParam = encodeURIComponent(input);
  } catch {
    return exitWithError('Could not URI encode JSON-LD!');
  }

  const url = `https://json-ld.org/playground/#json-ld=${queryParam}`;
  open(url);

  console.log(url);
}
const query = async (params: any[], soya: Soya): Promise<void> => {
  const [param1] = params;

  if (!param1)
    return exitWithError('No path specified!');

  try {
    logNiceConsole(await soya.query({
      name: param1,
    }));
  } catch {
    return exitWithError('Could not query repo!');
  }
}

export const systemCommands: {
  [key: string]: (params: Array<any>, soya: Soya) => Promise<void>,
} = {
  acquire,
  template,
  init,
  pull,
  push,
  similar,
  info,
  form,
  playground,
  'calculate-dri': calculateDri,
  query,
};
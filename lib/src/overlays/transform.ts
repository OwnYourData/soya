import proc from 'child_process';
import fs from 'fs/promises';
import * as jq from 'node-jq';
import { Overlays, SoyaDocument } from 'soya-js';
import { escapeFilename, makeTempDir } from '../utils/core';
import path from 'path';
import { logger } from '../services/logger';
import { Normalize, Pack } from 'senml-js';
import Handlebars from 'handlebars';

export class SoyaTransform implements Overlays.OverlayPlugin {
  private runJolt = async (spec: any[], data: any, executable: string = 'jolt'): Promise<Overlays.OverlayResult> => {
    const specFile = 'jolt-spec.json';
    const dataFile = 'jolt-data.json';

    logger.debug(`Creating temp dir for jolt spec`);
    const [removeTempDir, tempDirPath] = await makeTempDir();
    const specFilePath = path.join(tempDirPath, specFile);

    logger.debug(`Writing jolt spec to ${specFilePath}`);
    await fs.writeFile(specFilePath, JSON.stringify(spec));

    const dataFilePath = path.join(tempDirPath, dataFile);
    logger.debug(`Writing jolt data ${dataFilePath}`);
    await fs.writeFile(dataFilePath, JSON.stringify(data));

    return new Promise<Overlays.OverlayResult>((resolve, reject) => {
      const commandParams = [
        'transform',
        escapeFilename(specFilePath),
        escapeFilename(dataFilePath),
      ];

      logger.debug(`Executing jolt ${executable} with ${commandParams.toString()}`);
      proc.exec(executable + ' ' + commandParams.join(' '), (_, stdout) => {
        logger.debug('Removing temp dir');
        removeTempDir();

        let data: any;
        try {
          data = JSON.parse(stdout);
        } catch (e) {
          logger.error('Could not apply jolt transformation')
          logger.error('Is jolt installed on your system?')
          reject(e);
        }

        resolve({
          data,
        });
      });
    });
  }

  private runJq = async (filter: string, data: any): Promise<Overlays.OverlayResult> => {
    logger.debug('Executing jq');
    const jqOut = await jq.run(filter, data, {
      input: 'json',
    });

    return {
      data: typeof jqOut === 'string' ? JSON.parse(jqOut) : jqOut,
    }
  }

  private runSenMl = async (data: any): Promise<Overlays.OverlayResult> => {
    logger.debug('Executing SenML');

    const res = Normalize({
      Records: data,
    });

    // @ts-expect-error check if is of type error
    if (res.name && res.message) {
      throw new Error(JSON.stringify(res));
    } else {
      const _res = res as Pack;
      return { data: _res.Records };
    }
  }

  private runHandlebars = (templateObj: any, data: any): any => {
    for (const prop in templateObj) {
      const val = templateObj[prop];

      if (val && typeof val === 'object')
        // recurse!
        templateObj[prop] = this.runHandlebars(val, data);
      else if (typeof val === 'string' && /^{{.+}}$/g.test(val))
        templateObj[prop] = Handlebars.compile(val)(data);
    }

    return templateObj;
  }

  run = async (soyaDoc: SoyaDocument, data: any): Promise<Overlays.OverlayResult> => {
    for (const item of soyaDoc['@graph']) {
      // not a valid transformation overlay
      if (!(item.engine))
        continue;

      switch (item.engine) {
        case 'jolt':
          if (Array.isArray(item.value)) {
            return this.runJolt(item.value, data);
          }
          else
            throw new Error('jolt expects an array as input!');
        case 'jq':
          if (typeof item.value === 'string') {
            return this.runJq(item.value, data);
          }
          else
            throw new Error('jq expects a string as input!');
        case 'senml':
          if (Array.isArray(data)) {
            return this.runSenMl(data);
          }
          else
            throw new Error('senml expects an array as input!');
        case 'handlebars':
          if (item.value && typeof item.value === 'object') {
            return { data: this.runHandlebars(item.value, data) };
          }
          else
            throw new Error('handlebars expects an object as input!');
        default:
          throw new Error(`Transform engine ${item.engine} not supported!`);
      }
    }

    throw new Error('No transform overlay found!');
  }
}
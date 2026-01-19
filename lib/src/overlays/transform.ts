import proc from 'child_process';
import { promises as fs } from 'fs';
import * as jq from 'node-jq';
import { Overlays, SoyaDocument } from '..';
import { escapeFilename, makeTempDir } from '../utils/core';
import path from 'path';
import { logger } from '../services/logger';
import { Normalize, NormalizedRecord, Pack } from '@gebsl/senml-js';
import Handlebars, { TemplateDelegate } from "handlebars";

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
      const _res = res as Pack<NormalizedRecord>;
      return { data: _res.Records };
    }
  }

  private hbCache = new Map<string, TemplateDelegate>();
  private hbHelpersRegistered = false;
  private ensureHbHelpers(): void {
    if (this.hbHelpersRegistered) return;
    if (!Handlebars.helpers || !(Handlebars.helpers as any).eq) {
      Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
    }
    this.hbHelpersRegistered = true;
  }

  private compileOnce(tpl: string): TemplateDelegate {
    let fn = this.hbCache.get(tpl);
    if (!fn) {
      this.ensureHbHelpers();
      fn = Handlebars.compile(tpl);
      this.hbCache.set(tpl, fn);
    }
    return fn;
  }
  
  /**
   * Rendert beliebige JSON-ähnliche Strukturen mit Handlebars:
   * - Strings mit Inline-Templates ("prefix {{val}} suffix") werden unterstützt
   * - Mehrzeilige Templates funktionieren
   * - Arrays & verschachtelte Objekte werden rekursiv verarbeitet
   * - Optional: Schlüssel (Property-Namen) werden ebenfalls gerendert, falls sie {{...}} enthalten
   * - Mutiert das Eingabeobjekt NICHT (liefert eine Kopie zurück)
   */
  private runHandlebars = (input: unknown, data: any): any => {
    if (input == null) return input;

    // Arrays
    if (Array.isArray(input)) {
      return input.map(item => this.runHandlebars(item, data));
    }

    // Objekte
    if (typeof input === "object") {
      const out: Record<string, any> = {};
      for (const [rawKey, rawVal] of Object.entries(input as Record<string, any>)) {
        const key = rawKey.includes("{{")
          ? this.compileOnce(rawKey)(data)
          : rawKey;

        out[key] = this.runHandlebars(rawVal, data);
      }
      return out;
    }

    // Strings (inkl. Inline + mehrzeilig)
    if (typeof input === "string") {
      // Schneller Check: enthält überhaupt ein Mustache?
      if (input.includes("{{")) {
        try {
          // Handlebars unterstützt Zeilenumbrüche out of the box; kein RegEx nötig
          return this.compileOnce(input)(data);
        } catch {
          // Fallback: Unverändert zurückgeben, wenn ein Template fehlschlägt
          return input;
        }
      }
      return input;
    }

    // Alle anderen Typen (number, boolean, etc.) bleiben wie sie sind
    return input;
  };

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
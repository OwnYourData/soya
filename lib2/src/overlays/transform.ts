import * as jq from 'node-jq';
import { Overlays, SoyaDocument } from '..';
import { logger } from '../services/logger';
import { Normalize, NormalizedRecord, Pack } from '@gebsl/senml-js';
import Handlebars, { TemplateDelegate } from "handlebars";

export class SoyaTransform implements Overlays.OverlayPlugin {
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
          // jolt support has been removed with the Node 24 upgrade (soya-js >= 0.9)
          throw new Error('Transform engine "jolt" is no longer supported! Please use "jq" or "handlebars" instead.');
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

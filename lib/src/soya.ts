import DatasetExt from "rdf-ext/lib/Dataset";
import { MimeType, VaultMinMeta } from "vaultifier/dist/main";
import winston from "winston";
import { JsonParseError } from "./errors";
import { isInstance, SoyaDocument, SoyaInstance } from "./interfaces";
import { logger, setLogger } from "./services/logger";
import { SoyaQuery, SoyaQueryResult, SoyaInfo } from "./services/repo";
import { DEFAULT_SOYA_NAMESPACE, DEFAULT_XSD, RepoService } from "./services/repo";
import { flat2ld } from "./system/flat2ld";
import { SoyaFormOptions, getSoyaForm, SoyaFormResponse } from "./system/form";
import { map } from "./system/map";
import { yaml2soya } from "./system/yaml2soya";
import { calculateBaseUri, CalculationResult } from "./utils/dri";
import { parseJsonLd } from "./utils/rdf";
import { SparqlQueryBuilder } from "./utils/sparql";

const asStringInput = (input: unknown): string => {
  if (typeof input === 'object')
    return JSON.stringify(input);
  else
    return input as string;
}

const asObjectInput = (input: unknown): any => {
  if (typeof input === 'string')
    return JSON.parse(input);
  else
    return input as any;
}

export interface SoyaConfig {
  service?: RepoService;
  logger?: winston.Logger;
}

export interface PushResponse {
  value: any;
  item: VaultMinMeta;
}

export interface PullOptions {
  pullType: 'json-ld' | 'yaml',
}

export class Soya {
  public service: RepoService;

  constructor(config?: SoyaConfig) {
    this.service = config?.service ?? RepoService.getInstance();

    if (config?.logger)
      setLogger(config.logger);
  }

  init = async (yaml: string): Promise<SoyaDocument | undefined> => {
    return yaml2soya(yaml, DEFAULT_SOYA_NAMESPACE, this.service.repo, DEFAULT_XSD);
  }

  pull = async (path: string, options: PullOptions = {
    pullType: 'json-ld',
  }): Promise<SoyaDocument> => {
    const subPath = options.pullType === 'yaml' ? '/yaml' : '';
    return this.service.pull(`${path}${subPath}`);
  }

  push = async (input: unknown, additionalProperties: { [key: string]: any } = {}): Promise<PushResponse> => {
    const data = asObjectInput(input);
    let res: VaultMinMeta;
    let value: string | undefined;

    if (isInstance(data)) {
      logger.info('Pushing instance');

      let path: string | undefined;
      let repo: string | undefined;

      try {
        const url = data['@context']['@vocab'];
        // we already reverse the array here as we have to remove trailing slashes from the end
        let splitParts = url.split('/').reverse();

        // kill empty items (can happen if there is a trailing slash) at the end
        const firstNonempty = splitParts.findIndex(x => !!x);
        if (firstNonempty !== -1)
          splitParts = splitParts.slice(firstNonempty)

        // bring it into correct order
        splitParts = splitParts.reverse();

        // last bit is structure name or DRI
        path = splitParts[splitParts.length - 1];
        // everything before is the repo
        repo = splitParts.slice(0, -1).join('/');

        if (!path || !repo)
          throw new Error();
      } catch {
        throw new Error('Could not extract name of structure from @vocab');
      }

      logger.debug(`Path: ${path}`);
      logger.debug(`Repo: ${repo}`);

      const info = await new RepoService(repo).info(path);

      res = await this.service.pushItem({
        content: data,
        mimeType: MimeType.JSON,
        dri: (await this.calculateDri(data)).dri,
        schemaDri: info.dri,
      });
      value = res.raw;
    } else {
      logger.info('Pushing structure');

      res = await this.service.pushItem({
        content: data,
        mimeType: MimeType.JSON,
        ...additionalProperties,
      });
      const vaultItem = await (await this.service.getVaultifier()).getItem({
        id: res.id,
      });

      value = vaultItem.dri;
    }

    return {
      value: value,
      item: res,
    };
  }

  similar = async (input: unknown): Promise<any> => {
    return this.service.similar(asStringInput(input));
  }

  query = async (query: SoyaQuery): Promise<SoyaQueryResult[]> => {
    return this.service.query(query);
  }

  getSparqlBuilder = async (soyaDoc: SoyaDocument): Promise<SparqlQueryBuilder> => {
    const dataSet = await parseJsonLd(soyaDoc);

    if (dataSet.length === 0)
      throw new Error('Input data is not valid JSON-LD!');

    const layerSet = await parseJsonLd(soyaDoc);
    return new SparqlQueryBuilder(layerSet);
  }

  toCanonical = async (soyaDoc: SoyaDocument): Promise<string> => {
    const dataset = await parseJsonLd(soyaDoc);
    return dataset.toCanonical();
  }

  async info(path: string[]): Promise<SoyaInfo[]>;
  async info(path: string): Promise<SoyaInfo>;
  async info(path: string | string[]): Promise<SoyaInfo | SoyaInfo[]> {
    // @ts-expect-error ts does not get this although it's correct
    return await this.service.info(path);
  }

  calculateDri = async (content: any): Promise<CalculationResult> => {
    let json: any;

    if (typeof content === 'string')
      try {
        json = JSON.parse(content);
      } catch {
        throw new JsonParseError('Could not parse JSON');
      }
    else
      json = content;

    logger.debug('Raw input:');
    logger.debug(JSON.stringify(json));

    let quads: DatasetExt = await parseJsonLd(json);

    return calculateBaseUri({
      json,
      quads,
    });
  }

  acquire = async (path: string, flatJson: any): Promise<SoyaInstance> => {
    let soyaStructure: SoyaDocument = await this.service.pull(path);
    return flat2ld(flatJson, soyaStructure);
  }

  getForm = async (soyaDoc: SoyaDocument, options?: SoyaFormOptions): Promise<SoyaFormResponse> => {
    return getSoyaForm(soyaDoc, options);
  }

  map = map;
}
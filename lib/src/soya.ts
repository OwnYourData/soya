import DatasetExt from "rdf-ext/lib/Dataset";
import { MimeType, VaultItem } from "vaultifier/dist/main";
import winston from "winston";
import { JsonParseError } from "./errors";
import { isInstance, SoyaDocument, SoyaInstance } from "./interfaces";
import { logger, setLogger } from "./services/logger";
import { SoyaQuery, SoyaQueryResult, SoyaInfo } from "./services/repo";
import { DEFAULT_SOYA_NAMESPACE, RepoService } from "./services/repo";
import { flat2ld } from "./system/flat2ld";
import { getSoyaForm, SoyaForm } from "./system/form";
import { yaml2soya } from "./system/yaml2soya";
import { calculateBaseUri, CalculationResult } from "./utils/dri";
import { parseJsonLd } from "./utils/rdf";

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

export class Soya {
  public service: RepoService;

  constructor(config?: SoyaConfig) {
    this.service = config?.service ?? RepoService.getInstance();

    if (config?.logger)
      setLogger(config.logger);
  }

  init = async (yaml: string): Promise<SoyaDocument | undefined> => {
    return yaml2soya(yaml, DEFAULT_SOYA_NAMESPACE, this.service.repo);
  }

  pull = async (path: string): Promise<SoyaDocument> => {
    return this.service.pull(path);
  }

  push = async (input: unknown): Promise<VaultItem> => {
    const data = asObjectInput(input);

    if (isInstance(data)) {
      logger.info('Pushing instance');

      let structureName: string | undefined;

      try {
        const url = data['@context']['@vocab'];
        structureName = url.split('/')
          .reverse()
          // leave out empty items (can happen if there is a trailing slash)
          .filter(x => !!x)[0];

        if (!structureName)
          throw new Error();
      } catch {
        throw new Error('Could not extract name of structure from @vocab');
      }

      const info = await this.info(structureName);

      return this.service.pushItem({
        content: data,
        mimeType: MimeType.JSON,
        dri: (await this.calculateDri(data)).dri,
        schemaDri: info.dri,
      })
    } else {
      logger.info('Pushing structure');

      return this.service.pushValue(data);
    }
  }

  similar = async (input: unknown): Promise<any> => {
    return this.service.similar(asStringInput(input));
  }

  query = async (query: SoyaQuery): Promise<SoyaQueryResult[]> => {
    return this.service.query(query);
  }

  info = async (path: string): Promise<SoyaInfo> => {
    return this.service.info(path);
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

  acquire = async (path: string, flatJson: any): Promise<SoyaInstance[]> => {
    let soyaStructure: SoyaDocument = await this.service.pull(path);
    return flat2ld(flatJson, soyaStructure);
  }

  getForm = async (path: string): Promise<SoyaForm> => {
    const soyaStruc = await this.pull(path);
    return getSoyaForm(soyaStruc);
  }
}
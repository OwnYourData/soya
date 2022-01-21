import DatasetExt from "rdf-ext/lib/Dataset";
import { VaultItem } from "vaultifier";
import winston from "winston";
import { JsonParseError } from "./errors";
import { SoyaDocument } from "./interfaces";
import { logger, setLogger } from "./services/logger";
import { DEFAULT_SOYA_NAMESPACE, RepoService } from "./services/repo";
import { flat2ld, SoyaInstance } from "./system/flat2ld";
import { yaml2soya } from "./system/yaml2soya";
import { calculateBaseUri, CalculationResult } from "./utils/dri";
import { parseJsonLd } from "./utils/rdf";

const asStringInput = (input: unknown): string => {
  if (typeof input === 'object')
    return JSON.stringify(input);
  else
    return input as string;
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
    return this.service.push(asStringInput(input));
  }

  similar = async (input: unknown): Promise<any> => {
    return this.service.similar(asStringInput(input));
  }

  info = async (path: string): Promise<any> => {
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
    logger.debug(content);

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
}
import findRoot from 'find-root';
import fs from 'fs/promises'
import path from 'path';
import { logger } from '../services/logger';

const possibleFileExtensions = [
  'yml',
  'yaml',
];

const TEMPLATES_DIR = path.join(findRoot(__filename), 'res', 'templates');

export const getAvailableTemplates = async (): Promise<string[]> => {
  const templates: string[] = [];

  for (const file of await fs.readdir(path.join(TEMPLATES_DIR))) {
    templates.push(path.parse(file).name);
  }

  return templates;
}

export const tryPrintTemplate = async (name: string) => {
  for (const fe of possibleFileExtensions) {
    try {
      const file = await fs.readFile(path.join(TEMPLATES_DIR, `${name}.${fe}`), { encoding: 'utf-8' });

      console.log(file);
      return;
    } catch { }
  }

  logger.error(`Could not find template with name "${name}"`);
}
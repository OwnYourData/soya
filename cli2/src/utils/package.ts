import path from 'path';
import fs from 'fs';
import { logger } from '../services/logger';

interface PackageJson {
  name: string,
  version: string,
}

let json: PackageJson;

try {
  const raw = fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), { encoding: 'utf-8' });
  json = JSON.parse(raw);
} catch (e) {
  logger.error('Can not read package.json', e);
  process.exit(-1);
}

export const packageJson = json;
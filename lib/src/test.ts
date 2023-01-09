// use this file for simplified debugging of soya-js

// start the ts compiler: npm run dev
// execute this file: node dist/test.js

// test files go into the directory "tmp" in the project root

import { promises as fs } from "fs";
import path from "path";

import { Soya } from ".";

(async () => {
  // read test file from tmp directory
  const filePath = path.join(__dirname, '..', 'tmp', 'test.yaml');
  const docRaw = await fs.readFile(filePath, { encoding: 'utf-8' });

  const soya = new Soya();
  const doc = await soya.init(docRaw);

  // format and output
  console.log(JSON.stringify(doc, null, 2));
})();
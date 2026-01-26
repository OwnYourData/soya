import express from 'express';
import { Soya, Overlays, RepoService } from "soya-js";
import swaggerUi from 'swagger-ui-express';
import { promises as fs } from 'fs';
import path from 'path';
import { getFileRoot } from './utils/fs';

export const init = async () => {
  const app = express();
  app.use(express.json({
    // ensures that specifying the content type is not strictly necessary
    type: () => true,
  }));

  const swaggerDoc = await fs.readFile(path.join(getFileRoot(), 'http-openapi.json'), { encoding: 'utf-8' });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(JSON.parse(swaggerDoc)));

  const router = express.Router();
  app.use('/api/v1', router);

  const repoService = new RepoService(process.env['SOYA_REPO'] ?? "https://soya.ownyourdata.eu");
  const soya = new Soya({ service: repoService });

  router.get('/version', async (_, res) => {
    const content = await fs.readFile(path.join(getFileRoot(), 'package.json'), { encoding: 'utf-8' });
    const packageJson: any = JSON.parse(content);

    return res.status(200).send({
      name: packageJson.name,
      version: packageJson.version,
      dependencies: packageJson.dependencies,
    });
  });

  router.get('/form/:schemaDri', async (req, res) => {
    const schemaDri = req.params['schemaDri'];

    try {
      const soyaDoc = await soya.pull(schemaDri);
      const form = await soya.getForm(soyaDoc, {
        language: req.query['language'] as string,
        tag: req.query['tag'] as string,
      });

      return res.status(200).send(form);
    } catch (e: any) {
      return res.status(500).send(e.toString());
    }
  });

  router.post('/validate/jsonld', async (req, res) => {
    const content = req.body;
    if (!content)
      return res.status(400).send();

    try {
      await soya.toCanonical(content);
      return res.status(200).send({ message: 'Validation success' });
    } catch (e: any) {
      console.dir(e);
      return res.status(400).send({ message: e.toString(), error: e });
    }
  });

  router.post('/validate/:schemaDri', async (req, res) => {
    const content = req.body;
    const schemaDri = req.params['schemaDri'];

    if (!schemaDri || !content)
      return res.status(400).send();

    try {
      const soyaDoc = await soya.pull(schemaDri);
      const resVal = await new Overlays.SoyaValidate().run(soyaDoc, content);

      return res.status(200).send(resVal.data);
    } catch (e: any) {
      return res.status(500).send(e.toString());
    }
  });

  router.post('/transform/:schemaDri', async (req, res) => {
    const content = req.body;
    const schemaDri = req.params['schemaDri'];

    if (!schemaDri || !content)
      return res.status(400).send();

    try {
      const soyaDoc = await soya.pull(schemaDri);
      const resVal = await new Overlays.SoyaTransform().run(soyaDoc, content);

      return res.status(200).send(resVal.data);
    } catch (e: any) {
      return res.status(500).send(e.toString());
    }
  });

  router.post('/acquire/:schemaDri', async (req, res) => {
    const content = req.body;
    const schemaDri = req.params['schemaDri'];

    if (!schemaDri || !content)
      return res.status(400).send();

    try {
      const doc = await soya.acquire(schemaDri, content);
      return res.status(200).send(doc);
    } catch (e: any) {
      return res.status(500).send(e.toString());
    }
  });

  router.get('/map/:from/:to', async (req, res) => {
    const from = req.params['from'];
    const to = req.params['to'];

    if (!from || !to)
      return res.status(400).send();

    try {
      const fromDoc = await soya.pull(from);
      const toDoc = await soya.pull(to);

      const doc = await soya.map(fromDoc, toDoc);
      return res.status(200).send(doc);
    } catch (e: any) {
      return res.status(500).send(e.toString());
    }
  });

  router.post('/canonical', async (req, res) => {
    const doc = req.body;

    try {
      const canonical = await soya.toCanonical(doc);
      return res
        .status(200)
        .setHeader('Content-Type', 'text/turtle')
        .send(canonical);
    } catch (e: any) {
      console.error(e);
      return res.status(500).send(e.toString());
    }
  });

  const port = 8080;
  app.listen(port, () => {
    console.log(`Webserver running on port ${port}`);
  });
}

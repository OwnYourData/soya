import express from 'express';
import { Soya, Overlays, } from "soya-js";
import swaggerUi from 'swagger-ui-express';
import { promises as fs } from 'fs';
import path from 'path';
import { getFileRoot } from './utils/fs';

interface RequestModel {
  content?: string;
}

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

  const soya = new Soya();

  router.post('/validate/:schemaDri', async (req, res) => {
    const {
      content,
    } = req.body as RequestModel;

    const schemaDri = req.params['schemaDri'];

    if (!schemaDri || !content)
      return res.status(400);

    try {
      const soyaDoc = await soya.pull(schemaDri);
      const resVal = await new Overlays.SoyaValidate().run(soyaDoc, content);

      return res.status(200).send(resVal);
    } catch (e: any) {
      return res.status(500).send(e.toString());
    }
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

  const port = 8080;
  app.listen(port, () => {
    console.log(`Webserver running on port ${port}`);
  });
}
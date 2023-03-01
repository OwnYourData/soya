import express, { Request, Response } from 'express';
import { Soya, Overlays, } from "soya-js";

interface RequestModel {
  schemaDri?: string;
  content?: string;
}
const app = express();
app.use(express.json({
  // ensures that specifying the content type is not strictly necessary
  type: () => true,
}));

const router = express.Router();
app.use('/api/v1', router);

const soya = new Soya();

router.post('/validate', async (req: Request<{}, {}, RequestModel>, res: Response) => {
  const {
    content,
    schemaDri,
  } = req.body;

  if (!schemaDri || !content)
    return res.status(400);

  try {
    const soyaDoc = await soya.pull(schemaDri);
    const resVal = await new Overlays.SoyaValidate().run(soyaDoc, content);

    return res.status(200).send(resVal);
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.get('/form/:schemaDri', async (req, res) => {
  const schemaDri = req.params['schemaDri'];

  try {
    const soyaDoc = await soya.pull(schemaDri);
    const form = await soya.getForm(soyaDoc);

    return res.status(200).send(form);
  } catch (e) {
    return res.status(500).send(e);
  }
});

const port = 8080;
app.listen(port, () => {
  console.log(`Webserver running on port ${port}`);
});

const gracefulExit = () => {
  process.exit(0);
}
process.on('SIGTERM', gracefulExit);
process.on('SIGINT', gracefulExit);
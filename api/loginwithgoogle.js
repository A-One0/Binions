import { createDocument } from "../src/server/db.js";
import { createToken } from "../src/server/userfind/createtoken.js";
import config from "../src/server/config.json" assert { type: "json" };

export default async function handler(req, res) {
  const { user, name } = req.body;

  const token = createToken();


  const data = config.plrNull;
  data.methodConnexion = "google";
  data.username = name 
  data.actualtoken = token;

  await createDocument(config.dbCollectionPlayer, user.uid, data);
    
   res.status(200).json(token);
}
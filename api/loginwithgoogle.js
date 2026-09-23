const { createDocument } = require("../src/server/db.js");
const createToken = require("../src/server/userfind/createtoken.js");
const config = require("../src/server/config.json");

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
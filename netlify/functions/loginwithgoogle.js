const { signInWithGoogle } = require("../../src/server/db.js");

export default async function handler(req, res) {
  const plr = await signInWithGoogle();
    
   res.status(200).json(data);
}
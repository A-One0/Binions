const { signInWithGoogle } = require("/src/server/db.js");
const config = require("/src/server/config.json")

exports.handler = async (event, context) => {
    const plr = await signInWithGoogle();
    

}
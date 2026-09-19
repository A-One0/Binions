const { signInWithGoogle } = require("../../src/server/db.js");
const config = require("../../src/server/config.json")

exports.handler = async (event, context) => {
    const plr = await signInWithGoogle();
    
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Successfully signed in with Google", player: plr }),
    };
}
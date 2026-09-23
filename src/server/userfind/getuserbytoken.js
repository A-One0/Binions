const { readCollection} = require("../db.js")

export function getuserbytoken(token){
    const user = readCollection(config.dbCollectionPlayer, { actualtoken: token });
    return user;
}
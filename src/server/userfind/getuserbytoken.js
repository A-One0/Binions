const {readDocument, createDocument} = require("../db.js")


export function getuserbytoken(token){
    const user = readDocument(config.dbCollectionPlayer, token);
    return user;
}
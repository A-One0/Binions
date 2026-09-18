const config = require("../config.json")
const createtoken = require("../createtoken.js")

const {createDocument} = require("../db.js")


export function createuser(){
    const user = createDocument(config.dbCollectionPlayer, createtoken(), {token: token});
    return user;
}
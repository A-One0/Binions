const config = require("../config.json")
const createtoken = require("../createtoken.js")

const {createDocument} = require("../db.js")


export function createuser(user, pseudo){
const newUser = config.plrNull;

    newUser.token = createtoken();
    newUser.pseudo = pseudo;

    const user = createDocument(config.dbCollectionPlayer, user,config.plrNull);
    return user;
}
const {readDocument} = require("../db.js")

export function getuserbytoken(token){
    const user = readDocument("users", token);
    return user;
}
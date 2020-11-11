const express = require("express");
const uid = require("uid2");
const SHA86 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const router = express.Router();

//Importation des modèles
const User = require("../models/User");

module.exports = router;

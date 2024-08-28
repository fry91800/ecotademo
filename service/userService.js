const CustomError = require('../error/CustomError.js');
const db = require("../data/database.js");
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const orgaRepository = require('../data/orgaRepository')
const sessionRepository = require('../data/sessionRepository')
const commonRepository = require("../data/commonRepository");
const { logger, logEnter, logExit } = require('../config/logger');

async function login(mail, pass) {
    logger.debug(`Log in attempt: Mail: ${mail}, Pass: ${pass}`);
    // Step 1: Récupération du record posédant le mail envoyé
    const record = await orgaRepository.getLoginInfo(mail); // [{id, pass, *}]
    // Step 2: Vérification de l'existance du mail dans la base
    if (!record) {
      CustomError.mailNoExistError();
    }
    // Step 3: Vérification du mot de passe
    const match = await bcrypt.compare(pass, record.pass);
    if (!match) {
      CustomError.wrongPassError();
    }
    // Step 4: Création de la session
    const orgaid = record.id
    return sessionRepository.startSession(orgaid);
}

async function startResetPassSession(mail) {
    // Step 1: Generation d'un token (uuid)
    var resetToken = uuidv4();
    // Step 2: Insertion du token dans la base de donnée
    await orgaRepository.startResetPassSession(mail, resetToken)
    return resetToken;
}

async function checkResetToken(token) {
  return orgaRepository.checkResetToken(token);
}

async function resetPass(token, plainPassword) {
    // Step 1: Vérification de la validité du token de changement de pass
    await checkResetToken(token);
    // Step 2: Ajout de couche de sécurité
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    // Step 2: Modification du pass
    logger.debug("Updating password for token: " + token)
    await orgaRepository.resetPass(token, hashedPassword);
}

module.exports = {
  login,
  startResetPassSession,
  checkResetToken,
  resetPass
}
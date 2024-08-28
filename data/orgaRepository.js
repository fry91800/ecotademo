const db = require('../data/database.js');
const commonRepository = require("../data/commonRepository");
const { logger, logEnter, logExit } = require('../config/logger');

async function getLoginInfo(mail) {
    const query = { attribute: ["id", "pass"], where: { mail: mail } };
    return await commonRepository.getOne("Orga", query);
}

async function startResetPassSession(mail, resetToken) {
    // Step 1: Insertion du token dans la base
    const updateToken = { resettoken: resetToken }
    const whereMail = { where: { mail: mail } }
    logger.debug("Adding reset token: " + resetToken + " for user: " + mail);
    await commonRepository.update("Orga", updateToken, whereMail);
    // Step 2: Ajout de la date d'expiration pour la session
    const tokenExpirationDate = new Date();
    tokenExpirationDate.setMinutes(tokenExpirationDate.getMinutes() + 15); // 15 minutes
    const updateResetDeadLine = { resetdeadline: tokenExpirationDate }
    logger.debug("Adding token expiration date: " + tokenExpirationDate + " for user: " + mail);
    await commonRepository.update("Orga", updateResetDeadLine, whereMail)
}
async function getTeamById(id)
{
    const query = { attributes: ["team"], where: { id: id } }
    const record = await commonRepository.getOne("Orga", query);
    return record.team
}
async function checkResetToken(token) {
    // Step 1: Vérification de l'existence du token
    const query = { where: { resettoken: token } };
    const record = await commonRepository.getOne("Orga", query);
    if (!record) {
        CustomError.defaultError();
    }
    // Step 2: Vérification de la validité du token
    const now = new Date();
    if (now > record.resetdeadline) {
        CustomError.tokenExpiredError();
    }
    return true;
}

async function resetPass(token, hashedPassword)
{
    const updatePass = { pass: hashedPassword };
    const whereToken = { where: { resettoken: token } }
    await commonRepository.update("Orga", updatePass, whereToken);
}
module.exports = {
    getLoginInfo,
    startResetPassSession,
    checkResetToken,
    resetPass,
    getTeamById
}
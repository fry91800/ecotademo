const supplierRepository = require("../data/supplierRepository");
const { logger, logEnter, logExit } = require('../config/logger');
async function addComment(orgaid, year, erp, comment)
{
    try {
        return supplierRepository.addComment(orgaid, year, erp, comment);
    } catch (e) {
        logger.error("Error adding comment", e)
    }
}

module.exports = {
    addComment
}
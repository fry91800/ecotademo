const supplierRepository = require("../data/supplierRepository");
const { logger, logEnter, logExit } = require('../config/logger');
async function forceSelect(orgaid, bool, erp, comment)
{
    try {
        return supplierRepository.forceSelect(orgaid, bool, erp, comment);
    } catch (e) {
        logger.error("Error adding comment", e)
    }
}

module.exports = {
    forceSelect
}
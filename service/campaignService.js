const campaignRepository = require("../data/campaignRepository");
const commonRepository = require("../data/commonRepository");
const { logger, logEnter, logExit } = require('../config/logger');

async function getMostRecentCampaign() {

    return campaignRepository.getMostRecentCampaign();
}

module.exports = {
    getMostRecentCampaign
}
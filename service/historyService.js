const commonRepository = require("../data/commonRepository");
const { logger, logEnter, logExit } = require('../config/logger');
const { Op } = require('sequelize');
async function getSupplierHistory(erp) {
    const query = {};
    query["where"] = { erp: erp, year: { [Op.not]: "2024" } };
    try {
        const result = await commonRepository.getAll("SupplierSelection", query);
        const intensities = await commonRepository.getAll("SupplierCotaData", query);
        console.log(intensities);
        // Create a map for fast lookup of intensity based on the year
        const intensityMap = new Map(intensities.map(item => [item.year, item.intensity]));

        // Add the intensity from intensities to the corresponding item in result
        result.forEach(item => {
            item.intensity = intensityMap.get(item.year) || null; // Add intensity or null if not found
        });
        return result;
    } catch (e) {
        logger.error("Error retrieving supplier history", e)
    }
}

module.exports = {
    getSupplierHistory
}
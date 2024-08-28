const CustomError = require('../error/CustomError.js');
const sessionRepository = require("../data/sessionRepository.js");
const db = require('../data/database.js');
const datastruct = require("../utility/datastruct.js");
const { Op } = require('sequelize');
const campaignRepository = require("../data/campaignRepository.js");
const intensityRepository = require("../data/intensityRepository.js");
const supplierRepository = require("../data/supplierRepository.js");
async function shouldSelectErpByRevenue(erp) {
    // Step 1: Obtention du revenue % de la campagne actuelle
    const campaign = await campaignRepository.getMostRecentCampaign();
    const campaignRevenue = campaign.revenue;
    // Step 2: Obtention de la team sur laquelle se pencher
    const teamCode = await supplierRepository.getTeamFromErp(erp);
    // Step 3: Obtention des data relatives aux CA par divisions
    const teamData = await supplierRepository.getAllRevenueDataByTeam(teamCode);

    // Step 4: Calcul du revenue totale pour la team courrante
    const totalRevenue = teamData.reduce((acc, { revenue }) => acc + revenue, 0);

    // Step 5: Sort la data par revenue descendant
    const sortedTeamData = teamData.sort((a, b) => b.revenue - a.revenue);

    // Step 6: Vérification si l'erp devrait être sélectionné
    let accumulatedRevenue = 0;
    for (const { erp: currentErp, revenue } of sortedTeamData) {
        if (accumulatedRevenue / totalRevenue >= campaignRevenue / 100) break;
        if (currentErp === erp) {
            return true;
        }
        accumulatedRevenue += revenue;
    }

    return false;
}

async function shouldSelectErpByIntensity(erp) {
    // Step 1: Obtention de l'intensity de la campagne actuelle
    const campaign = await campaignRepository.getMostRecentCampaign();
    const campaignIntensity = campaign.intensity;
    console.log("Intensity requise: " + campaignIntensity)
    // Step 2: Obtention de l'intensité du supplier pour l'année passée
    const lastYear = campaign.year - 1;
    const supplierIntensity = await supplierRepository.getSupplierIntensity(erp, lastYear);
    if (!supplierIntensity) {
        return false
    }
    // Step 3 Selection des Erps avec aux moins le niveau d'intensité année-1 requis
    if (supplierIntensity >= campaignIntensity) {
        return true
    }
    return false;
}
async function shouldSelectErpByReason(erp) {
    const campaign = await campaignRepository.getMostRecentCampaign();
    const currentYear = campaign.year;
    const record = await supplierRepository.getRecordByErpAndYear(erp, currentYear);
    if (Object.values(record).includes(true)) {
        return true;
    }
    return false
}
async function updateSelectionStatus(erp) {
    // Get the current Campaign year
    const campaign = await campaignRepository.getMostRecentCampaign();
    const currentYear = campaign.year;
    const shouldRevenue = await shouldSelectErpByRevenue(erp);
    const shouldIntensity = await shouldSelectErpByIntensity(erp);
    const shouldReason = await shouldSelectErpByReason(erp);
    const supplierForce = await supplierRepository.getSupplierForceByErpAndYear(erp, currentYear);
    if (shouldRevenue || shouldIntensity || shouldReason) {
        // Update
        await supplierRepository.updateSelection(true, erp, currentYear);
        var selected = supplierForce ? supplierForce : true;
        return { selected: selected }
    }
    else {
        // Update
        await supplierRepository.updateSelection(false, erp, currentYear);
        var selected = supplierForce ? supplierForce : false;
        return { selected: false }
    }
}
async function checkReason(bool, orgaid, erp, reason, comment) {
    const campaign = await campaignRepository.getMostRecentCampaign();
    const currentYear = campaign.year;
    await supplierRepository.checkReason(bool, orgaid, erp, reason, comment, currentYear);
    return updateSelectionStatus(erp);
}

/*async function uncheckReason(orgaid, erp, reason, comment) {
    const campaign = await campaignRepository.getMostRecentCampaign();
    const currentYear = campaign.year;
    await supplierRepository.checkReason(bool, orgaid, erp, reason, comment, currentYear);
    return updateSelectionStatus(erp);
}*/

async function getSelectionData(userTeam) {
    const campaign = await campaignRepository.getMostRecentCampaign();
    const currentCampaignYear = campaign.year;
    const response = await supplierRepository.getSelectionSupplierData(currentCampaignYear, userTeam);
    // Update les intensity null à 0
    response.forEach(obj => {
        if (obj.intensity === null) {
            obj.intensity = "";
        }
        if (obj.intensityCode === null) {
            obj.intensityCode = 0;
        }
        if (obj.force !== null) {
            obj.selected = obj.force;
        }
    });
    const lastYearIntensities = await supplierRepository.getSelectionSupplierIntensities();

    const mergedData = response.flatMap(resp => {
        // Find the matching intensities for the current ERP
        const matchingIntensities = lastYearIntensities.filter(intensity => intensity.erp === resp.erp);

        if (matchingIntensities.length > 0) {
            // Return all matching intensities
            return matchingIntensities.map(intensity => ({
                ...resp, // Spread all fields from the response object
                intensityCode: intensity.intensityCode,
                intensity: intensity.intensity
            }));
        } else {
            // If no matching intensities, return the response object with null or default values for intensity fields
            return [{
                ...resp,
                intensityCode: 0,
                intensity: ""
            }];
        }
    });
    return mergedData;
}

module.exports = {
    checkReason,
    getSelectionData
}
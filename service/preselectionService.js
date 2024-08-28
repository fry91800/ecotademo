const CustomError = require('../error/CustomError.js');
const sessionRepository = require("../data/sessionRepository.js");
const db = require('../data/database.js');
const datastruct = require("../utility/datastruct.js");
const { Op } = require('sequelize');
const { logger, logEnter, logExit } = require('../config/logger');
const campaignRepository = require("../data/campaignRepository.js");
const intensityRepository = require("../data/intensityRepository.js");
const supplierRepository = require("../data/supplierRepository.js");
const teamRepository = require("../data/teamRepository.js");

/*
async function addCurrentCampaign() {
  try {
    // Step 1: Check si la campagne de l'année courante existe déjà
    const currentCampaign = await campaignRepository.getCurrentCampain(); // [*]
    // Step 2: Création de la campagne de l'année courrante si non existante
    if (!currentCampaign) {
      await campaignRepository.addCurrentCampaign();
    }
  }
  catch (e) {
    console.error("error trying to add the current campaign: ", e)
  }
}
*/
async function addPreselectionParams(revenue, intensity) {
  const possibleIntensities = await intensityRepository.getIntensityLevels(); //[1, 2, 3...]
  // Step 2: Check validité intensity
  if (!possibleIntensities.includes(intensity)) {
    CustomError.wrongParam();
  }
  // Step 3: Check validité revenue
  if (revenue < 0 || revenue > 100) {
    CustomError.wrongParam();
  }
  // Step 4: Obtention de la campagne la plus récente
  const mostRecentCampaign = await campaignRepository.getMostRecentCampaign();
  // Step 5: Ajout dans la base de données
  const campaignYear = mostRecentCampaign.year
  await campaignRepository.updateParams(campaignYear, revenue, intensity)
}


//Synchronise la table supplierSelection par rapport à la table maîtresse de suppliers
async function syncSuppliers() {
  // Step 1: Obtention de la liste de tous les suppliers de la table maitresse
  const suppliers = await supplierRepository.getAllMasterSupplier(); // [ {erp, name}, ... ]
  // Step 2: Selection des suppliers de la campagne courante
  const mostRecentCampaign = campaignRepository.getMostRecentCampaign();
  const campaignYear = mostRecentCampaign.year
  const currentCampaignSuppliers = await supplierRepository.getCampaignSuppliers(campaignYear) // [ {erp, name} ... ]
  // Step 3: Transformation en dictionnaire pour un accès rapide
  const suppliersDic = datastruct.dictionarize(suppliers, "erp", ["name"]);
  const campaignDic = datastruct.dictionarize(currentCampaignSuppliers, "erp", ["name"])
  // Step 4: Obtention des listes des erps
  const suppliersErps = new Set(suppliers.map(({ erp }) => erp));
  const campaignErps = new Set(currentCampaignSuppliers.map(({ erp }) => erp));
  // Step 5: Ajout des suppliers manquants
  const suppliersToAdd = Array.from(suppliersErps).filter(erp => !campaignErps.has(erp));
  if (suppliersToAdd.length > 0) {
    const newSuppliers = suppliersToAdd.map(erp => ({
      year: campaignYear,
      erp,
      name: suppliersDic[erp].name
    }));
    await supplierRepository.insertSuppliers(newSuppliers)
  }
  // Step 6: Suppression des suppliers en trop
  const suppliersToDelete = Array.from(campaignErps).filter(erp => !suppliersErps.has(erp));
  if (suppliersToDelete.length > 0) {
    await supplierRepository.removeSuppliers(suppliersToDelete, campaignYear)
  }

  // Step 7: Synchronisation des noms
  for (const erp of campaignErps) {
    if (suppliersDic[erp] && campaignDic[erp].name !== suppliersDic[erp].name) {
      await supplierRepository.updateName(erp, currentYear, suppliersDic[erp].name)
    }
  }
}

async function getSelectedByRevenue() {
  // Step 1: Obtention du revenue % de la campagne actuelle
  const campaign = await campaignRepository.getMostRecentCampaign();
  const campaignRevenue = campaign.revenue;
  // Step 2: Obtention de la liste des teams
  const teamsCodes = await teamRepository.getAllCodes(); // [ "MB02", "MB03" ... ]
  // Step 3: Obtention des data relatives aux CA par divisions
  const suppliersRevenues = await supplierRepository.getRevenueData(); // [ {erp, revenue, team } ... ]
  const selectedErps = [];
  // Step 4: Filtrage des erps
  teamsCodes.forEach(teamsCode => {
    // Step 4.1: Filtrage des données sur la team courrante
    const teamData = suppliersRevenues.filter(item => item.team === teamsCode);

    // Step 4.2 Calcul du revenue totale pour la team courrante
    const totalRevenue = teamData.reduce((acc, { revenue }) => acc + revenue, 0);

    // Step 4.3: Sort la data par revenue descendant
    const sortedTeamData = teamData.sort((a, b) => b.revenue - a.revenue);

    // Step 4.4 Récupération des erps jusqu'au dépassement du seuil (revenue %)
    let accumulatedRevenue = 0;
    for (const { erp, revenue } of sortedTeamData) {
      if (accumulatedRevenue / totalRevenue >= campaignRevenue / 100) break;
      selectedErps.push(erp);
      accumulatedRevenue += revenue;
    }
  });

  return selectedErps;
}

async function getSelectedByIntensity() {
  // Step 1: Obtention de l'intensity de la campagne actuelle
  const campaign = await campaignRepository.getMostRecentCampaign();
  const campaignIntensity = campaign.intensity;
  // Step 2: Obtention des data relatives aux intensité des suppliers de la campagne passée
  const lastYear = campaign.year - 1
  const suppliersIntensities = await supplierRepository.getIntensitiesByYear(lastYear); // [ {erp, intensity}, ...]
  const selectedErps = [];
  // Step 3 Selection des Erps avec aux moins le niveau d'intensité année-1 requis
  for (const { erp, intensity } of suppliersIntensities) {
    if (intensity >= campaignIntensity) {
      selectedErps.push(erp);
    }
  }
  return selectedErps;
}

async function getSelectedByReason() {
  // Step 1: Obtention de l'année de la campagne courante
  const campaign = await campaignRepository.getMostRecentCampaign();
  const year = campaign.year
  // Step 2: Obtention de la liste des erp avec une raison selectionée
  const erps = await supplierRepository.getHasReasonCheckedByYear(year);
  return erps; // ["erp1", "erp2", ...]
}

async function autoCheck() {
  // Step 0: Obtention de la data de la campagne courante
  const campaign = await campaignRepository.getMostRecentCampaign();
  const currentYear = campaign.year
  // Step 1: Obtention de la liste des erps devant être sélectionnés
  const selectedByRevenue = await getSelectedByRevenue();
  const selectedByIntensity = await getSelectedByIntensity();
  const selectedByReasons = await getSelectedByReason();
  const should = [...new Set([...selectedByRevenue, ...selectedByIntensity, ...selectedByReasons])]; // ["erp1","erp2", ...]
  // Step 2: Obtention de la liste des erps sélectionnés cette année

  const current = await supplierRepository.getSelectedErpsByYear(currentYear);
  // Step 3: Selection des manquants
  const erpsToSelect = should.filter(erp => !current.includes(erp));
  if (erpsToSelect.length > 0) {

    await supplierRepository.select(erpsToSelect, currentYear);
  }
  // Step 4: Désélection des suppliers en trop
  const erpsToDeselect = current.filter(erp => !should.includes(erp));
  if (erpsToDeselect.length > 0) {
    await supplierRepository.deselect(erpsToDeselect, currentYear);
  }
}
async function preselect(revenuePercentage, intensity) {
  logEnter();
  logger.debug("Adding the preselection params");
  await addPreselectionParams(revenuePercentage, intensity)
  //logger.debug("Sync suppliers");
  //await syncSuppliers();
  logger.debug("AutoCheck suppliers");
  await autoCheck();
  logExit();
}

module.exports = {
  preselect
}
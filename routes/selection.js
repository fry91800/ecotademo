var express = require('express');
const CustomError = require('../error/CustomError');
const { logger, logEnter, logExit } = require('../config/logger');
const preselectionService = require('../service/preselectionService');
const selectionService = require('../service/selectionService');
const commentService = require('../service/commentService');
const forceSelectionService = require('../service/forceSelectionService');
const campaignService = require('../service/campaignService');
const orgaRepository = require('../data/orgaRepository');
const historyService = require("../service/historyService");
var router = express.Router();

router.get('/', async function (req, res, next) {
  try {
    // Step 1: Récupère la campagne la plus récente
    const campaign = await campaignService.getMostRecentCampaign();
    logger.debug("Most recent campaign found: " + campaign.year);
    // Step 2: Ajoute les paramètres de la campagne à disposition du pug
    res.locals.campaignRevenue = campaign.revenue;
    res.locals.campaignIntensity = campaign.intensity;
    logger.debug("Campaign Revenue: " + campaign.revenue + ", Campaign Intensity: " + campaign.intensity);
    res.render("selection");
  } catch (error) {
    next(error);
  }
});

router.post('/preselection', async function (req, res, next) {
  try {
    // Step 1: Vérification des paramètres saisies
    const revenue = Number(req.body.revenue);
    const intensity = Number(req.body.intensity);
    if (isNaN(revenue) || isNaN(intensity)) {
      CustomError.wrongParam();
    }
    // Step 2: Ajouts ds paramètres dans la base
    logger.debug("Calling Selection service preselect: revenue: " + revenue + ", intensity: " + intensity);
    await preselectionService.preselect(revenue, intensity);
    res.redirect("/en/selection")
  }
  catch (e) {
    next(e)
  }
});

router.post('/reason/:action', async function (req, res, next) {
  if (!req.body.erp || !req.body.reason || !req.body.comment) {
    CustomError.missingFieldError();
  }
  try {
    let response = { selected: false };
    var orgaid = 1;
    if (res.locals.session) {
      orgaid = res.locals.session.orgaid
    }
    if (req.params.action === "check") {
      response = await selectionService.checkReason(true, orgaid, req.body.erp, req.body.reason, req.body.comment);
    }
    else if (req.params.action === "uncheck") {
      response = await selectionService.checkReason(false, orgaid, req.body.erp, req.body.reason, req.body.comment);
    }
    else {
      CustomError.defaultError();
    }
    res.json(response);
  }
  catch (e) {
    next(e)
  }
});

router.post('/comment', async function (req, res, next) {
  try {
    if (!req.body.erp || !req.body.comment) {
      CustomError.missingFieldError();
    }
    const year = req.body.year ?? new Date().getFullYear();
    var orgaid = 1;
    if (res.locals.session) {
      orgaid = res.locals.session.orgaid
    }
    var response = await commentService.addComment(orgaid, year, req.body.erp, req.body.comment);
    res.json(response);
    //res.redirect("/en/selection")
  }
  catch (e) {
    next(e)
  }
});

router.post('/force', async function (req, res, next) {
  if (!req.body.forceBool || !req.body.erp || !req.body.comment) {
    CustomError.missingFieldError();
  }
  var orgaid = 1;
  if (res.locals.session) {
    orgaid = res.locals.session.orgaid
  }
  try {
    const response = await forceSelectionService.forceSelect(orgaid, req.body.forceBool, req.body.erp, req.body.comment);
    res.json(response);
    //res.redirect("/en/selection")
  }
  catch (e) {
    next(e)
  }
});

router.get('/data', async (req, res) => {
  res.locals.formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };
  let userTeam = null;
  if (res.locals.session && res.locals.session.role === 2) {
    userTeam = await orgaRepository.getTeamById(res.locals.session.orgaid);
  }
  const data = await selectionService.getSelectionData(userTeam);
  const { page = 1, selected = false, notSelected = false, supplier = '',
    revenueSign = ">", revenue = 0, intensity0 = false, intensity1 = false, intensity2 = false, intensity3 = false, intensity4 = false,
    reason1Selected = false, reason1NotSelected = false, reason2Selected = false, reason2NotSelected = false,
    reason3Selected = false, reason3NotSelected = false, reason4Selected = false, reason4NotSelected = false,
    sortField = '', sortOrder = 'asc' } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;

  let filteredData = data;

  if (supplier) {
    filteredData = filteredData.filter(entry => entry.supplier.toLowerCase().includes(supplier.toLowerCase()));
  }
  if (selected === 'true') {
    filteredData = filteredData.filter(entry => entry.selected === true);
  }
  if (notSelected === 'true') {
    filteredData = filteredData.filter(entry => entry.selected === false);
  }
  if (revenueSign === ">") {
    filteredData = filteredData.filter(entry => entry.revenue > revenue);
  }
  if (revenueSign === "<") {
    filteredData = filteredData.filter(entry => entry.revenue < revenue);
  }
  if (intensity0 === 'true' || intensity1 === 'true' || intensity2 === 'true' || intensity3 === 'true' || intensity4 === 'true') {
    if (intensity0 === 'false') {
      filteredData = filteredData.filter(entry => entry.intensityCode !== 0);
    }
    if (intensity1 === 'false') {
      filteredData = filteredData.filter(entry => entry.intensityCode !== 1);
    }
    if (intensity2 === 'false') {
      filteredData = filteredData.filter(entry => entry.intensityCode !== 2);
    }
    if (intensity3 === 'false') {
      filteredData = filteredData.filter(entry => entry.intensityCode !== 3);
    }
    if (intensity4 === 'false') {
      filteredData = filteredData.filter(entry => entry.intensityCode !== 4);
    }
  }

  if (reason1Selected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason1 === true);
  }
  if (reason1NotSelected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason1 === false);
  }
  if (reason2Selected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason2 === true);
  }
  if (reason2NotSelected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason2 === false);
  }
  if (reason3Selected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason3 === true);
  }
  if (reason3NotSelected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason3 === false);
  }
  if (reason4Selected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason4 === true);
  }
  if (reason4NotSelected === 'true') {
    filteredData = filteredData.filter(entry => entry.reason4 === false);
  }

  function customCompare(a, b, sortField, sortOrder) {
    const valueA = a[sortField];
    const valueB = b[sortField];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    } else if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    } else {
      return 0;
    }
  }
  if (sortField) {
    filteredData.sort((a, b) => customCompare(a, b, sortField, sortOrder));
  }

  const paginatedData = filteredData.slice(offset, offset + limit);

  res.json(paginatedData);
});

router.get('/history', async (req, res, next) => {
  try {
    /*
    res.json([
      {year: "2023", selected: "true", supplier:"corp1", revenue: "1000000", intensity: 4, reason1: false, reason2: false, reason3: false, reason4: false, comment: "Bien"},
      {year: "2022", selected: "true", supplier:"corp1Old", revenue: "2000000", intensity: 4, reason1: true, reason2: false, reason3: false, reason4: false, comment: "Mauvais"}
    ])
    */
    const { erp } = req.query;
    const result = await historyService.getSupplierHistory(erp);
    res.json(result)
  }
  catch (e) {
    next(e)
  }
});

module.exports = router;
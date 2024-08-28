const db = require('../data/database.js');
const commonRepository = require("../data/commonRepository");
const { Op } = require('sequelize');
const { logger, logEnter, logExit } = require('../config/logger');

async function getRevenueData() {
    const query = { attributes: ["erp", "revenue", "team"], order: [['revenue', 'DESC']] };
    return commonRepository.getAll("Supplier1", query)
}

async function getIntensitiesByYear(year) {
    const query = { attributes: ["erp", "intensity"], where: { year: year } }
    return commonRepository.getAll("SupplierCotaData", query)
}
async function getSupplierIntensity(erp, year) {
    const query = {
        attributes: ["erp", "intensity"],
        where: { erp: erp, year: year }
    };
    const record = await commonRepository.getOne("SupplierCotaData", query);
    if (!record)
    {
        return null;
    }
    return record.intensity
}
async function updateSelection(bool, erp, year){
    const updateSelect = { selected: bool };
    const whereSelect = { where: { erp: erp, year: year } };
    await commonRepository.update("SupplierSelection", updateSelect, whereSelect);
}
async function getSupplierForceByErpAndYear(erp, year)
{
    const query = {
        attributes: ["force"],
        where: { erp: erp, year: year}
    }
    const supplierRecord = await commonRepository.getOne("SupplierSelection", query);
    return supplierRecord.force
}
async function getRecordByErpAndYear(erp, year)
{
    const query = {
        attributes: ["reason1", "reason2", "reason3", "reason4", "reason5"],
        where: { erp: erp, year: year }
    }
    return await commonRepository.getOne("SupplierSelection", query);
}
async function getAllRevenueDataByTeam(teamCode)
{
    const query = {
        attributes: ["erp", "revenue"],
        where: { team: teamCode },
        order: [['revenue', 'DESC']]
    }
    return commonRepository.getAll("Supplier1", query);
}
async function getTeamFromErp(erp)
{
    const query = { attributes: ["team"], where: { erp: erp } }
    const record = await commonRepository.getOne("Supplier1", query);
    return record.team;
}
async function updateName(erp, year, name){
    const updateName = { name: name }
    const where = { where: { erp: erp, year: year } }
    await commonRepository.update("SupplierSelection", updateName, where);
}
async function removeSuppliers(suppliersToDelete, year)
{
    await commonRepository.destroy("SupplierSelection", { erp: suppliersToDelete, year: year })
}
async function insertSuppliers(newSuppliers)
{
    await commonRepository.insertMany("SupplierSelection", newSuppliers);
}
async function getCampaignSuppliers(year)
{
    const querySuppliers = { attributes: ["erp", "name"], where: { year: year } };
    return commonRepository.getAll("SupplierSelection", querySuppliers);
}
async function getHasReasonCheckedByYear(year) {
    const query = {
        attributes: ['erp'], where: {
            year: year,
            [Op.or]: [
                { reason1: true },
                { reason2: true },
                { reason3: true },
                { reason4: true },
                { reason5: true },
            ]
        }
    }
    const rows = await commonRepository.getAll("SupplierSelection", query);
    return rows.map(row => row.erp);
}
async function getSelectedErpsByYear(year) {
    const querySelected = { attributes: ['erp'], where: { selected: true, year: year } }
    const currentRows = await commonRepository.getAll("SupplierSelection", querySelected)
    return currentRows.map(obj => obj.erp)
}
async function select(erpsToSelect, year) {
    const updateSelect = { selected: true }
    const whereErpToSelect = { where: { erp: { [Op.in]: erpsToSelect }, year: year } }
    await commonRepository.update("SupplierSelection", updateSelect, whereErpToSelect);
}
async function deselect(erpsToSelect, year) {
    const updateSelect = { selected: false }
    const whereErpToSelect = { where: { erp: { [Op.in]: erpsToSelect }, year: year } }
    await commonRepository.update("SupplierSelection", updateSelect, whereErpToSelect);
}
async function checkReason(bool, orgaid, erp, reason, comment, year) {
        const updateData = { commenter: orgaid, comment: comment };
        updateData[reason] = bool;
        const where = {where: { erp: erp, year: year }}
        await commonRepository.update("SupplierSelection", updateData, where)
}

async function getAllMasterSupplier(){
    const queryMaster = { attributes: ["erp", "name"] };
    return await commonRepository.getAll("Supplier1", queryMaster);
}

async function addComment(orgaid, year, erp, comment) {
        const update = { comment: comment, commenter: orgaid };
        const where = { where: { erp: erp, year: year } };
        await commonRepository.update("SupplierSelection", update, where);
        return { status: 200 };
}
async function forceSelect(orgaid, bool, erp, comment) {
        const update = { force: bool, comment: comment, commenter: orgaid };
        const where = { where: { erp: erp } };
        await commonRepository.update("SupplierSelection", update, where);
        return { status: 200 };
}

async function getSelectionSupplierData(currentCampaignYear, userTeam) {
        let whereString = `WHERE supplierselection.year = '${currentCampaignYear}'`;
        if (userTeam) {
            whereString = whereString + ` AND supplier1.team = '${userTeam}'`;
        }
        const [results, metadata] = await db.sequelize.query(
            `SELECT supplierselection.force as force, supplierselection.selected as selected, supplierselection.erp as erp,
            supplierselection.name as supplier, supplier1.revenue as revenue, supplierselection.reason1 as reason1,
            supplierselection.reason2 as reason2, supplierselection.reason3 as reason3, supplierselection.reason4 as reason4,
            supplierselection.comment as comment
            FROM supplierselection
            LEFT JOIN supplier1 on supplierselection.erp = supplier1.erp
            ${whereString}`,
            {
                type: db.sequelize.QueryTypes.RAW
            }
        );
        
        return results
}

async function getSelectionSupplierIntensities() {
        const [results, metadata] = await db.sequelize.query(
            `SELECT suppliercotadata.erp as erp, intensity.id as "intensityCode", intensity.desc as intensity
            FROM suppliercotadata
            JOIN intensity on suppliercotadata.intensity = intensity.id`,
            {
                type: db.sequelize.QueryTypes.RAW
            }
        );
        return results
}
module.exports = {
    getRevenueData,
    getIntensitiesByYear,
    getSupplierIntensity,
    updateSelection,
    getHasReasonCheckedByYear,
    getSupplierForceByErpAndYear,
    getRecordByErpAndYear,
    getSelectedErpsByYear,
    select,
    deselect,
    checkReason,
    getAllMasterSupplier,
    addComment,
    forceSelect,
    getSelectionSupplierData,
    getSelectionSupplierIntensities,
    getCampaignSuppliers,
    insertSuppliers,
    removeSuppliers,
    updateName,
    getAllRevenueDataByTeam,
    getTeamFromErp,
}
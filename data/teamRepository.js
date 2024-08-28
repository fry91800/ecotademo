const db = require('../data/database.js');
const commonRepository = require("../data/commonRepository");
async function getAllCodes() {
    const query = { attributes: ["code"] }
    const teamsCodes = await commonRepository.getAll("Team", query);
    return teamsCodes.map(obj => obj.code);
}

module.exports = {
    getAllCodes
}
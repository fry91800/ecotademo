const db = require('../data/database.js');
const commonRepository = require("../data/commonRepository");
async function getOne(query = {}) {
    query["raw"] = true;
    return db.Intensity.findOne(query);
}
async function getAll(query = {}) {
    query["raw"] = true;
    return db.Intensity.findAll(query);
}
async function getIntensityLevels() {
    const intensities = await db.Intensity.findAll({
        attributes: ['id'],
        raw: true
    })
    return intensities.map(elt => elt.id);
}


module.exports = {
    getOne,
    getAll,
    getIntensityLevels
}
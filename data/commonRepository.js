const db = require('./database.js');

async function getOne(table, query = {}) {
    query["raw"] = true;
    return db[table].findOne(query);
}
async function getAll(table, query = {}) {
    query["raw"] = true;
    return db[table].findAll(query);
}
async function insertOne(table, object) {
    return db[table].create(object);
}
async function insertMany(table, objects) {
    return db[table].bulkCreate(objects);
}
async function update(table, update, where) {
    await db[table].update(update, where)
}
async function destroy(table, where) {
    await db[table].destroy(where)
}

module.exports = {
    getOne,
    getAll,
    insertOne,
    insertMany,
    update,
    destroy,
}
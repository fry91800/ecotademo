//const db = require("./database")
const db = require("./database")
const commonRepository =  require("../data/commonRepository");
const { logger, logEnter, logExit } = require('../config/logger');

async function startSession(orgaid)
{
  const object = { orgaid: orgaid };
  return commonRepository.insertOne("Session",object);
}

async function endSession(sessionid)
{
  var now = Date();
  const update = { endtime: now }
  const where = { where: {id: sessionid} };
  await commonRepository.update("Session", update, where);
}

async function getSessionData(sessionId) {
  const [results, metadata] = await db.sequelize.query(
    `SELECT session.id as sessionid, orga.id as orgaid, orga.mail as mail, orga.role as role
    FROM session
    JOIN orga on session.orgaid = orga.id
    WHERE session.id = :var
    AND session.endtime IS NULL`,
    {
      replacements: { var: sessionId },
      type: db.sequelize.QueryTypes.SELECT
    }
  );
  return results
}

async function getSessionStats() {
  const [results, metadata] = await db.sequelize.query(
    `SELECT session.id as sessionid, orga.id as orgaid, orga.mail as mail, orga.role as role
    FROM session
    JOIN orga on session.orgaid = orga.id`,
    {
      type: db.sequelize.QueryTypes.RAW
    }
  );
  return results
}
module.exports = {
  startSession,
  endSession,
  getSessionData,
  getSessionStats
}
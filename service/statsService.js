const CustomError = require('../error/CustomError.js');
const sessionRepository = require("../data/sessionRepository");
async function getStats()
{
  try{
    var sessionStats = await sessionRepository.getSessionStats();
    var sessionCountAdmin = sessionStats.reduce((acc, obj) => {
      return obj.mail === "admin" ? acc + 1 : acc;
    }, 0);
    var sessionCountManager = sessionStats.reduce((acc, obj) => {
      return obj.mail === "manager" ? acc + 1 : acc;
    }, 0);
    var sessionCountBuyer = sessionStats.reduce((acc, obj) => {
      return obj.mail === "buyer" ? acc + 1 : acc;
    }, 0);
    return {sessionCountAdmin, sessionCountManager, sessionCountBuyer}
  }
  catch(e)
  {
    console.error(e);
  }
}
module.exports = {
  getStats
}
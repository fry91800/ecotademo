var express = require('express');
var router = express.Router();
const statsService = require("../service/statsService");

/* Redirection*/
router.get('/', async function (req, res, next) {
    try {
        res.locals.stats = await statsService.getStats();
        res.render("stats");
    }
    catch (e) {
        next(e);
    }
});
module.exports = router;
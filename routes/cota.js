var express = require('express');
var router = express.Router();
const statsService = require("../service/statsService");

/* Redirection*/
router.get('/:orgaid', async function (req, res, next) {
    try {
        res.render("cota");
    }
    catch (e) {
        next(e);
    }
});
module.exports = router;
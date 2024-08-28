var express = require('express');
var router = express.Router();
const statsService = require("../service/statsService");

/* Redirection*/
router.get('/:erp', async function (req, res, next) {
    try {
        res.render("supplier");
    }
    catch (e) {
        next(e);
    }
});
module.exports = router;
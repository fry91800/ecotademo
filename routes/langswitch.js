const express = require('express');
const router = express.Router();
const { logger, logEnter, logExit } = require('../config/logger');

// Change le cookie de langue 
router.get('/:langswitch', function(req, res, next) {
    const sessionTime = 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    logger.debug("Language Cookie set to: "+req.params.langswitch)
    res.cookie('lang', req.params.langswitch, { maxAge: sessionTime, httpOnly: true });
    res.redirect("back");
});

module.exports = router;
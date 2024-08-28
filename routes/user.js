var express = require('express');
var router = express.Router();
const db = require("../data/database.js");
const CustomError = require('../error/CustomError');
const userService = require("../service/userService");
const sessionRepository = require("../data/sessionRepository");
const { logger, logEnter, logExit } = require('../config/logger');


// Page de connexion utilisateur
router.get('/login', async function (req, res, next) {
  if (res.locals.session) {
    return res.redirect("/");
  }
  res.render('login');
});

// Endpoint de connexion utilisateur
router.post('/login', async function (req, res, next) {
  try {
    // Step 1: Vérifie l'existence des champs
    if (!req.body.mail || !req.body.pass) {
      CustomError.missingFieldError();
    }
    // Step 2: Log in
    const session = await userService.login(req.body.mail, req.body.pass);
    // Step 3: Set le cookie de session
    sessionTime = 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    res.cookie('session', session.id, { maxAge: sessionTime, httpOnly: true });
    res.redirect("/");
  } catch (e) {
    next(e);
  }
});

// Endpoint de deconnexion
router.get('/logout', async function (req, res, next) {
  try {
    // Rediriger l'utilisateur vers la racine s'il n'est pas connecté
    if (!res.locals.session) {
      return res.redirect("/");
    }
    // Step 1: End the session, server side
    var sessionid = res.locals.session.sessionid
    await sessionRepository.endSession(sessionid);
    // Step 2: End the session, client side
    res.clearCookie('session');
    res.redirect("/");
  }
  catch (e) {
    next(e);
  }
});

// Page de récupération du mot de passe
router.get('/recovery', async function (req, res, next) {
  res.render('recovery');
});

//Endpoint de récupération du mot de passe
router.post('/recovery', async function (req, res, next) {
  try {
    //Erreur en cas de champs non remplis
    if (!req.body.mail) {
      CustomError.missingFieldError();
    }
    // Step 1: Débute une session de récupération de mot de passe
    var resetToken = await userService.startResetPassSession(req.body.mail);
    // Step 2: Envoie du lien de récupération à l'utilisateur
    logger.info("http://localhost:3000/fr/user/passreset?token=" + resetToken)
    res.redirect("/");
  } catch (e) {
    next(e);
  }
});

// Page modification du mot de passe
router.get('/passreset', async function (req, res, next) {
  try {
    if (!req.query.token) {
      CustomError.defaultError();
    }
    await userService.checkResetToken(req.query.token);
    res.locals.token = req.query.token;
    return res.render('passreset');
  }
  catch (e) {
    next(e);
  }
});

// Endpoint de modification du mot de pass
router.post('/passreset', async function (req, res, next) {
  try {
    if (!req.body.pass || !req.body.confirmpass) {
      CustomError.missingFieldError();
    }
    if (req.body.pass !== req.body.confirmpass) {
      CustomError.differentPassError();
    }
      await userService.resetPass(req.query.token, req.body.pass);
      res.redirect("/");
  } catch (e) {
    next(e);
  }
});
module.exports = router;
require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { logger, logEnter, logExit } = require('./config/logger');
const { CustomError } = require('./error/CustomError');
const db = require("./data/database.js");
const sessionRepository = require("./data/sessionRepository");
const i18n = require('i18n');
const accepts = require('accepts');

//Getting the routers
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const selectionRouter = require('./routes/selection');
const cotaRouter = require('./routes/cota');
const langswitchRouter = require('./routes/langswitch');
const statsRouter = require('./routes/stats');
const supplierRouter = require('./routes/supplier');

var app = express();

//Définition de la liste des langues
const supportedLanguages = ['en', 'fr'];

// Configuration de i18n : Package pour le multilangue
i18n.configure({
  locales: supportedLanguages,
  directory: __dirname + '/locales',
  defaultLocale: 'en',
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//Middlewares
app.use(i18n.init);
//app.use(logger('dev')); unused
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



//Language middleware
app.use('/:lang', function (req, res, next) {
  // Step 1: Vérification du cookie de langue en premier
  var languageCookie = req.cookies.lang;
  if (languageCookie) {
    if (req.params.lang !== languageCookie) {
      const newUrl = req.originalUrl.replace("/" + req.params.lang + "/", "/" + languageCookie + "/");
      logger.debug(newUrl)
      return res.redirect(newUrl);
    }
  }
  //Step 2: Si cookie inexistant, Vérification du header Accept-Language
  else {
    const accept = accepts(req);
    const bestLang = accept.language(supportedLanguages) || 'en'; // anglais par défaut
    if (req.params.lang !== bestLang) {
      const newUrl = req.originalUrl.replace("/" + req.params.lang + "/", "/" + bestLang + "/");
      return res.redirect(newUrl);
    }
  }
  const lang = req.params.lang;
  if (supportedLanguages.includes(lang)) {
    res.setLocale(lang);
    res.locals.lang = lang;
  } else {
    return res.status(404).send('Language not supported');
  }
  next();
});

//Auth middleware
app.use(async function (req, res, next) {
  try {
    const sessionid = req.cookies.session
    if (sessionid) {
      const session = await sessionRepository.getSessionData(sessionid)
      if (session) {
        logger.debug("Auth Middleware: Current session: " + JSON.stringify(session));
        res.locals.session = session
      }
    }
    else {
      logger.debug("Auth Middleware: No current session")
    }
    next();
  }
  catch (e) {
    logger.error("test: "+e.message);
  }
}
)

app.use('/', indexRouter);
app.use('/:lang/user', userRouter);
app.use('/:lang/selection', selectionRouter);
app.use('/:lang/cota', cotaRouter);
app.use('/:lang/langswitch', langswitchRouter);
app.use('/:lang/stats', statsRouter);
app.use('/:lang/supplier', supplierRouter);

//error handler
app.use(function (err, req, res, next) {
  console.error(err);
  if (err instanceof CustomError) {
    res.status(err.status).json({ error: err.message });
  } else {
    logger.error(err.message)
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;

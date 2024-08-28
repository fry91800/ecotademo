var express = require('express');
var router = express.Router();

// Redirection depuis la racine
router.get('/', function(req, res, next) {
  if (res.locals.session && res.locals.session.orgaid < 3)
  {
    res.redirect("/en/selection");
  }
  else if(res.locals.session)
  {
    res.redirect(`/${res.currentLang}/cota/${res.locals.session.orgaid}`);
  }
  else{
    res.redirect("/en/user/login");
  }
});
module.exports = router;
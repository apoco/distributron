'use strict';

module.exports = {
  getLocalizer: getLocalizer,
  getTranslator: getTranslator
};

var prefs = require('../repositories/preferences');
var Localizer = require('localize');
var localizer = new Localizer(require('./translations.json'));
localizer.throwOnMissingTranslation(false);


function getLocalizer() {
  localizer.setLocale(prefs.language);
  return localizer;
}

function getTranslator() {
  var localizer = getLocalizer();
  return localizer.translate.bind(localizer);
}

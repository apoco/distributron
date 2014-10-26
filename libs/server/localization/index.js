'use strict';

module.exports = {
  getLocalizer: getLocalizer
};

var Localizer = require('localize');
var translations = require('./translations.json');

function getLocalizer() {
  var localizer = new Localizer(translations);

  var locale = require('continuation-local-storage')
    .getNamespace('session')
    .get('locale');
  localizer.setLocale(locale);
  localizer.throwOnMissingTranslation(false);

  return localizer;
}

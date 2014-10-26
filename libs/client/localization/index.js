'use strict';

var Localizer = require('localize');
var translations = require('./translations.json');
var localizer = new Localizer(translations);

localizer.setLocale(navigator.userLanguage || navigator.language || 'en-US');
localizer.throwOnMissingTranslation(false);

module.exports = localizer;

'use strict';

module.exports = LocalizedStrings;

var path = require('path');
var localeRegex = /[a-z]+(-[a-z]+)*/;

function LocalizedStrings(directory, localeAccessor) {
  this.directory = directory;
  this.localeAccessor = localeAccessor;
}

LocalizedStrings.prototype.get = function(key) {
  var locale = this.localeAccessor() || '';
  locale = locale.toLowerCase();
  if (!localeRegex.test(locale))
    locale = '';

  while (locale) {
    try {
      var stringModule = require(path.resolve(this.directory, './' + locale));
      if (key in stringModule) {
        return stringModule[key];
      }
    }
    catch (e) {

    }
    locale = locale.replace(/-?[a-z]+$/, '');
  }
  return require(path.resolve(this.directory, './default'))[key];
};

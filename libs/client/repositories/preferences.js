'use strict';

module.exports = new PreferencesRepository();

function PreferencesRepository() { }
createProperty('language', navigator.userLanguage || navigator.language || 'en');

function createProperty(name, defaultValue) {
  var key = "prefs." + name;
  Object.defineProperty(PreferencesRepository.prototype, name, {
    get: function() {
      return localStorage.getItem(key) || defaultValue;
    },
    set: function(value) {
      localStorage.setItem(key, value);
    }
  });
}

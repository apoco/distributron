"use strict";

module.exports = new AppConfiguration();

function AppConfiguration() {
  this.settings = {};
}

var path = require('path');

var defaults = {
  port: 8000,
  database: null,
  init: false,
  authTokenExpirationInSeconds: 30 * 24 * 60 * 60,
  lockoutLoginAttempts: 10,
  lockoutDurationInSeconds: 5 * 60 * 60
};

AppConfiguration.prototype.initialize = function(args, configPath) {
  this.settings = configPath
    ? require(path.relative(__dirname, path.resolve(process.cwd(), configPath)))
    : {};
  Object
    .keys(defaults)
    .forEach(function(setting) {
      this.settings[setting] = args[setting] || this.settings[setting] || defaults[setting]
    }.bind(this));

  if (!this.settings.database) {
    throw new Error('Missing database argument or config setting');
  }
};

"use strict";

module.exports = new AppConfiguration();

var path = require('path');
var _ = require('lodash');

var defaults = {
  port: 8000,
  init: false,
  authTokenExpirationInSeconds: 30 * 24 * 60 * 60,
  lockoutLoginAttempts: 10,
  lockoutDurationInSeconds: 5 * 60
};

function AppConfiguration() {
  this.settings = {};
}

AppConfiguration.prototype.initialize = function(args, configPath) {
  var configFileSettings = configPath
    ? require(path.relative(__dirname, path.resolve(process.cwd(), configPath)))
    : {};
  _.assign(this.settings, defaults, configFileSettings, args);

  if (!this.settings.database) {
    throw new Error('Missing database argument or config setting');
  }
};

"use strict";

module.exports = new AppConfiguration();

function AppConfiguration() {
  this.settings = {};
}

var path = require('path');

AppConfiguration.prototype.initialize = function(args, configPath) {
  this.settings = configPath
    ? require(path.relative(__dirname, path.resolve(process.cwd(), configPath)))
    : {};
  this.settings.port = args.port || this.settings.port || 8000;
  this.settings.database = args.database || this.settings.database;
  this.settings.init = args.init;
  this.settings.authTokenExpirationInSeconds = this.settings.authTokenExpirationInSeconds || 30 * 24 * 60 * 60;

  if (!this.settings.database) {
    throw new Error('Missing database argument or config setting');
  }
};

"use strict";

var Promise = require('bluebird');
var domain = require('domain');
var path = require('path');
var express = require('express');
var orm = Promise.promisifyAll(require('orm'));

domain.create()
  .on('error', function(err) {
    console.error(err.stack);
    process.exit();
  })
  .run(function() {
    Promise.bind({})
      .then(initConfig)
      .then(function(config) {
        this.config = config;
        return initDatabase(config);
      })
      .then(function() {
        return initApp();
      })
      .then(function(app) {
        app.listen(this.config.port);
        console.log('Listening at http://localhost:' + this.config.port);
      })
      .catch(function(err) {
        console.error('Failed to start:', err.stack);
      })
      .done();
  });

function initConfig() {
  var config = require('./config');
  var args = require('yargs').argv;
  var configPath = args._[0];

  config.settings = configPath
    ? require(path.relative(__dirname, path.resolve(process.cwd(), configPath)))
    : {};
  config.settings.port = args.port || config.settings.port || 8000;
  config.settings.database = args.database || config.settings.database;
  config.settings.init = args.init;

  if (!config.settings.database) {
    throw new Error('Missing database argument or config setting');
  }

  return config.settings;
}

function initDatabase(config) {
  return orm.connectAsync(config.database)
    .then(function(db) {
      db.settings.set('instance.cache', false);
      require('./data').initialize(db);
      if (config.init) {
        return Promise.promisify(db.sync, db).call();
      }
    });
}

function initApp() {
  var app = express();
  app.use(require('./middleware/session-storage'));
  app.use(require('./middleware/localization'));
  app.use(require('body-parser').json());

  var resourcesPath = path.resolve(__dirname, './resources');
  require('require-directory')(module, resourcesPath, {
    visit: function(module) {
      module.addRoutes(app);
    }
  });

  app.use('/assets', require('./middleware/static-files'));
  app.use(require('./middleware/ui'));
  app.use(require('./middleware/error-handler'));

  return app;
}

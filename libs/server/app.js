"use strict";

var domain = require('domain');
var path = require('path');
var async = require('async');
var express = require('express');
var orm = require('orm');

domain.create()
  .on('error', function(err) {
    console.error(err.stack);
    process.exit();
  })
  .run(function() {
    async.auto({
      config: initConfig,
      app: ['database', initApp],
      database: ['config', initDatabase]
    }, function(err, results) {
      if (err) {
        return void console.error('Failed to start:', err);
      }

      results.app.listen(results.config.port);

      // Important: integration tests are waiting for something from stdout before continuing on with setup;
      // must leave this here.
      console.log('Listening at http://localhost:' + results.config.port);
    });
  });

function initConfig(cb) {
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
    return void cb(new Error('Missing database argument or config setting'));
  }

  cb(null, config.settings);
}

function initApp(cb) {
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

  cb(null, app);
}

function initDatabase(cb, options) {
  async.waterfall([
    function(next) {
      orm.connect(options.config.database, next);
    },
    function(db, next) {
      require('./data').initialize(db);
      if (options.config.init) {
        return void db.sync(next);
      }
      next(null, db);
    }
  ], cb);
}

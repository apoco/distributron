"use strict";

var domain = require('domain');
var path = require('path');
var q = require('q');
var express = require('express');
var orm = require('orm');
var args = require('yargs').argv;
var configPath = args._[0];

domain.create()
  .on('error', function(err) {
    console.error(err);
    process.exit();
  })
  .run(function() {

    var config = require('./config');
    config.settings = configPath
      ? require(path.relative(__dirname, path.resolve(process.cwd(), configPath)))
      : {};

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

    var dbURL = args.database || config.settings.database;
    if (!dbURL) {
      throw new Error('Missing database argument or config setting');
    }

    var connectToDatabase = q.defer();
    orm.connect(dbURL, connectToDatabase.makeNodeResolver());

    connectToDatabase.promise
      .then(function(db) {

        require('./repositories').initialize(db);
        if (args.init) {
          db.sync();
        }

        var port = args.port || config.settings.port || 8000;
        app.listen(port);

        // Important: integration tests are waiting for something from stdout before continuing on with setup;
        // must leave this here.
        console.log('Listening at http://localhost:' + port);
      })
      .fail(function(err) {
        console.log(err);
        console.error(err);
      });
  });

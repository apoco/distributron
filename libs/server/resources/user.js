"use strict";

module.exports = {
  addRoutes: function(app) {
    app.get('/api/users/:username', handleGetUser);
  }
};

var q = require('q');
var async = require('async');
var config = require('../config').settings;
var validator = require('../../common/validator');

function handleGetUser(req, res, next) {
  var users = require('../data').repositories.users;

  var dfd = q.defer();
  users.find({ username: req.params.username }, dfd.makeNodeResolver());
  dfd.promise
    .then(function(users) {
      if (users.length) {
        res.json({ username: users[0].username });
      } else {
        res.status(404).end();
      }
    })
    .fail(next);
}

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
var status = require('../enums/user-status');

function handleGetUser(req, res, next) {
  var users = require('../data').repositories.users;

  var dfd = q.defer();
  users.find({ username: req.params.username }, dfd.makeNodeResolver());
  dfd.promise
    .then(function(users) {
      var user = users[0];
      if (user && user.status !== status.pending) {
        res.json({ username: user.username });
      } else {
        res.status(404).end();
      }
    })
    .fail(next);
}

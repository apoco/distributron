"use strict";

module.exports = {
  addRoutes: function(app) {
    app.get('/api/users/:username', handleGetUser);
  }
};

var Promise = require('bluebird');
var config = require('../config').settings;
var validator = require('../../common/validator');
var status = require('../enums/user-status');

function handleGetUser(req, res, next) {
  var users = Promise.promisifyAll(require('../data').repositories.users);

  users.findAsync({ username: req.params.username })
    .get(0)
    .then(function(user) {
      if (user && user.status !== status.pending) {
        res.json({ username: user.username });
      } else {
        res.status(404).end();
      }
    })
    .catch(next);
}

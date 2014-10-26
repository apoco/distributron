"use strict";

module.exports = {
  addRoutes: function(app) {
    app.head('/api/users/:username', handleUserHeadRequest);
    app.get('/api/users/:username', handleGetUserRequest);
    app.get('/api/users/:username/question', handleGetUserSecurityQuestion);
  }
};

var Promise = require('bluebird');
var config = require('../config').settings;
var validator = require('../../common/validator');
var status = require('../enums/user-status');
var users = Promise.promisifyAll(require('../data').repositories.users);
var NotFoundError = require('../errors/not-found');

function handleUserHeadRequest(req, res, next) {
  getUserByUsername(req.params.username, { only: ['username', 'status' ] })
    .then(function() {
      res.status(200).end();
    })
    .catch(NotFoundError, function() {
      res.status(404).end();
    })
    .catch(next);
}

function handleGetUserRequest(req, res, next) {
  getUserByUsername(req.params.username, { only: [ 'username', 'status' ] })
    .then(function(user) {
      res.status(200).json(user);
    })
    .catch(NotFoundError, function() {
      res.status(404).end();
    })
    .catch(next);
}

function handleGetUserSecurityQuestion(req, res, next) {
  getUserByUsername(req.params.username, { only: [ 'securityQuestion', 'status' ] })
    .then(function(user) {
      res.json(user.securityQuestion);
    })
    .catch(NotFoundError, function() {
      res.status(404).end();
    })
    .catch(next);
}

function getUserByUsername(username, options) {
  return users.findAsync({ username: username }, options)
    .get(0)
    .then(function(user) {
      if (user && user.status !== status.pending) {
        return user;
      } else {
        throw new NotFoundError();
      }
    });
}

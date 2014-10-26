"use strict";

module.exports = {
  addRoutes: function(app) {
    app.head('/api/users/:username', handleUserHeadRequest);
    app.get('/api/users/:username', handleGetUserRequest);
    app.get('/api/users/:username/question', handleGetUserSecurityQuestion);
    app.post('/api/users/:username/question', handlePostSecurityAnswer);
  }
};

var Promise = require('bluebird');
var bufferTools = require('buffertools');
var crypto = Promise.promisifyAll(require('crypto'));
var config = require('../config').settings;
var validator = require('../../common/validator');
var status = require('../enums/user-status');
var cryptoUtils = require('../utils/crypto');
var emailUtils = require('../utils/email');
var users = Promise.promisifyAll(require('../data').repositories.users);
var NotFoundError = require('../errors/not-found');
var AuthenticationError = require('../errors/authentication');

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

function handlePostSecurityAnswer(req, res, next) {
  var user;
  getUserByUsername(req.params.username)
    .then(function(dbUser) {
      user = dbUser;
      return cryptoUtils.getSaltedHash(user.securityAnswerSalt, req.body.answer);
    })
    .then(function(hash) {
      if (bufferTools.compare(hash, user.securityAnswerHash) !== 0) {
        throw new AuthenticationError('Invalid answer');
      }

      return crypto.randomBytesAsync(32);
    })
    .then(function(buffer) {
      var password = buffer.toString('base64');
      var resetUrl =
        '/reset-password/'
        + encodeURIComponent(user.username)
        + '?password='
        + encodeURIComponent(password);
      return emailUtils.send(
        user.username,
        'Password Reset',
        'password-reset',
        { password: password, passwordResetUrl: resetUrl });
    })
    .then(function() {
      res.status(204).end();
    })
    .catch(NotFoundError, function() {
      res.status(404).end();
    })
    .catch(AuthenticationError, function() {
      res.status(401).end();
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

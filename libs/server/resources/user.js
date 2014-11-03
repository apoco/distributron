"use strict";

module.exports = {
  addRoutes: function(app) {
    app.head('/api/users/:username', handleUserHeadRequest);
    app.get('/api/users/:username', handleGetUserRequest);
    app.get('/api/users/:username/question', handleGetUserSecurityQuestion);
    app.post('/api/users/:username/question', handlePostSecurityAnswer);
    app.put('/api/users/:username/password', handlePasswordChange);
  }
};

var Promise = require('bluebird');
var crypto = Promise.promisifyAll(require('crypto'));
var config = require('../config').settings;
var validator = require('../../common/validator');
var status = require('../enums/user-status');
var cryptoUtils = require('../utils/crypto');
var emailUtils = require('../utils/email');
var urlUtils = require('../utils/url');
var users = Promise.promisifyAll(require('../data').repositories.users);
var NotFoundError = require('../errors/not-found');
var AuthenticationError = require('../errors/authentication');

function handleUserHeadRequest(req, res, next) {
  getUserByUsername(req.params.username, { only: ['username', 'status' ] })
    .then(function() {
      res.status(200).end();
    })
    .catch(next);
}

function handleGetUserRequest(req, res, next) {
  getUserByUsername(req.params.username, { only: [ 'username', 'status' ] })
    .then(function(user) {
      res.status(200).json(user);
    })
    .catch(next);
}

function handleGetUserSecurityQuestion(req, res, next) {
  getUserByUsername(req.params.username, { only: [ 'securityQuestion', 'status' ] })
    .then(function(user) {
      res.json(user.securityQuestion);
    })
    .catch(next);
}

function handlePostSecurityAnswer(req, res, next) {
  var user, password;
  getUserByUsername(req.params.username)
    .then(function(dbUser) {
      user = dbUser;
      return cryptoUtils.validateHashedValue(
        user.securityAnswerSalt,
        req.body.answer.toLowerCase(),
        user.securityAnswerHash);
    })
    .then(function(isValid) {
      if (!isValid) {
        throw new AuthenticationError('Invalid answer');
      }
      return crypto.randomBytesAsync(32);
    })
    .then(function(buffer) {
      password = buffer.toString('base64');
      return user.setPassword(password);
    })
    .then(function() {
      var resetUrl = urlUtils.format(
        '/reset-password/{username}?password={password}',
        { username: user.username, password: password });
      var templateData = { password: password, passwordResetUrl: resetUrl };
      return emailUtils.send(user.username, 'Password Reset', 'password-reset', templateData);
    })
    .then(function() {
      res.status(204).end();
    })
    .catch(next);
}

function handlePasswordChange(req, res, next) {
  var user;
  getUserByUsername(req.params.username)
    .then(function(theUser) {
      user = theUser;
      return user.validatePassword(req.body.old);
    })
    .then(function(isValid) {
      if (!isValid) {
        throw new AuthenticationError('Invalid password');
      }
      return user.setPassword(req.body.password);
    })
    .then(function() {
      res.status(204).end();
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
        throw new NotFoundError('Username not found');
      }
    });
}

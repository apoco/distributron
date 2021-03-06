'use strict';

module.exports = {
  addRoutes: function (app) {
    app.post('/api/tokens', handleAuthentication);
    app.delete('/api/tokens/:token', handleTokenExpiration);
  }
};

var Promise = require('bluebird');
var AuthenticationError = require('../errors/authentication');
var uuid = require('node-uuid');
var users = Promise.promisifyAll(require('../data').repositories.users);
var authTokens = Promise.promisifyAll(require('../data').repositories.authTokens);
var status = require('../enums/user-status');
var config = require('../config').settings;

function handleAuthentication(req, res, next) {
  var tr = require('../localization').getTranslator();
  var authErrorMessage = tr('Invalid username or password');

  users
    .findAsync({ username: req.body.username, status: status.active })
    .get(0)
    .bind({})
    .then(function(user) {
      if (!user) {
        throw new AuthenticationError(authErrorMessage);
      } else if (user.isLockedOut()) {
        throw new AuthenticationError(tr('Your account has been temporarily locked because of too many login failures'));
      }

      this.user = user;
      return this.user.validatePassword(req.body.password);
    })
    .then(function(isValid) {
      if (!isValid) {
        throw new AuthenticationError(authErrorMessage);
      }

      var now = new Date();
      return authTokens.createAsync({
        id: uuid.v4(),
        userId: this.user.id,
        createdTimestamp: now.toISOString(),
        expirationTimestamp: new Date(now.getTime() + config.authTokenExpirationInSeconds).toISOString()
      });
    })
    .then(function(token) {
      res.status(200).json(token.id);
    })
    .catch(next);
}

function handleTokenExpiration(req, res, next) {
  return new Promise(function(resolve, reject) {
    authTokens
      .find({ id: req.params.token })
      .remove(function(err) {
        err ? reject(err) : resolve();
      });
    })
    .then(function() {
      res.status(204).end();
    })
    .catch(next);
}

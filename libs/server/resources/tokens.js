'use strict';

module.exports = {
  addRoutes: function (app) {
    app.post('/api/tokens', handleAuthentication)
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
  users
    .findAsync(
      { username: req.body.username, status: status.active },
      { only: ['id', 'passwordSalt', 'passwordHash'] })
    .get(0)
    .bind({})
    .then(function(user) {
      if (!user) {
        throw new AuthenticationError('Invalid username or password');
      }

      this.user = user;
      return this.user.isPasswordValid(req.body.password);
    })
    .then(function(isValid) {
      var now = Date.now();
      return authTokens.createAsync({
        id: uuid.v4(),
        userId: this.user.id,
        createdTimestamp: now,
        expirationTimestamp: now + config.authTokenExpirationInSeconds
      });
    })
    .then(function(token) {
      res.status(200).json(token.id);
    })
    .catch(next);
}

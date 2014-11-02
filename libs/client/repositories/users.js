'use strict';

module.exports = new UsersRepository();

var Promise = require('bluebird');
var reqwest = require('reqwest');
var api = require('../api');

function UsersRepository() {
  this.current = null;
}

UsersRepository.prototype.checkIfExists = function(username) {
  return api.users.item(username).head();
};

UsersRepository.prototype.register = function(data) {
  return api.users.post(data);
};

UsersRepository.prototype.login = function(data) {
  return api.tokens.post(data)
    .bind(this)
    .then(function(token) {
      this.current = {
        username: data.username,
        token: token
      };
    });
};

UsersRepository.prototype.logout = function() {
  var token = this.current && this.current.token;
  if (token) {
    return api.tokens.item(token).delete();
  } else {
    return Promise.resolve(null);
  }
};

UsersRepository.prototype.getSecurityQuestion = function(username) {
  return api.users.item(username).property('question').get();
};

UsersRepository.prototype.resetPassword = function(data) {
  return api.users.item(data.username).property('question').post(data);
};

UsersRepository.prototype.setPassword = function(data) {
  return api.users.item(data.username).property('password').put(data);
};

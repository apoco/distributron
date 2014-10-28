"use strict";

module.exports = {
  addRoutes: function(app) {
    app.post('/api/users', handleUsersPost);
  }
};

var Promise = require('bluebird');
var crypto = Promise.promisifyAll(require('crypto'));
var config = require('../config').settings;
var validator = require('../../common/validator');
var status = require('../enums/user-status');
var cryptoUtils = require('../utils/crypto');
var emailUtils = require('../utils/email');
var usersRepo = Promise.promisifyAll(require('../data').repositories.users);
var UserAlreadyActivatedError = require('../errors/user-already-activated');

function handleUsersPost(req, res, next) {

  if (!validator.isEmailAddress(req.body.username)) {
    return void res.status(422).send('You must provide a valid email address');
  }

  var user;
  ensureIsNewUser(req)
    .then(generateUser.bind(null, req))
    .then(function(generatedUser) {
      user = generatedUser;
      return usersRepo.createAsync(user);
    })
    .then(function() {
      return sendEmail(user);
    })
    .then(function() {
      res.status(204).end();
    })
    .catch(next);
}

function ensureIsNewUser(req) {
  return usersRepo.findAsync({ username: req.body.username })
    .get(0)
    .then(function(user) {
      if (user) {
        if (user.status === status.pending) {
          return Promise.promisify(user.remove, user).call();
        } else {
          throw new UserAlreadyActivatedError('This account is already activated');
        }
      }
    });
}

function generateUser(req) {
  var passwordSalt = getRandomBytes(),
    answerSalt = getRandomBytes(),
    passwordHash = Promise.join(passwordSalt, function (salt) {
      return cryptoUtils.getSaltedHash(salt, req.body.password);
    }),
    answerHash = Promise.join(answerSalt, function (salt) {
      return cryptoUtils.getSaltedHash(salt, req.body.answer);
    });
  return Promise.props({
    id: require('node-uuid').v4(),
    username: req.body.username,
    status: status.pending,
    passwordSalt: passwordSalt,
    passwordHash: passwordHash,
    securityQuestion: req.body.question,
    securityAnswerSalt: answerSalt,
    securityAnswerHash: answerHash,
    activationCode: getRandomBytes().call('toString', 'hex'),
    createdTimestamp: new Date()
  });
}

function sendEmail(user) {
  var activationUrl = config.baseUrl + 'activate/' + encodeURIComponent(user.activationCode);
  return emailUtils.send(
    user.username,
    'Activate your account',
    'activation',
    { activationUrl: activationUrl });
}

function getRandomBytes() {
  return crypto.randomBytesAsync(32);
}

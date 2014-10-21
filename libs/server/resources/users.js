"use strict";

module.exports = {
  addRoutes: function(app) {
    app.post('/api/users', handleUsersPost);
  }
};

var Promise = require('bluebird');
var crypto = Promise.promisifyAll(require('crypto'));
var mailer = require('nodemailer');
var config = require('../config').settings;
var validator = require('../../common/validator');
var status = require('../enums/user-status');
var usersRepo = Promise.promisifyAll(require('../data').repositories.users);
var UserAlreadyActivatedError = require('../errors/user-already-activated');

function handleUsersPost(req, res, next) {

  if (!validator.isEmailAddress(req.body.username)) {
    return void res.status(422).send('You must provide a valid email address');
  }

  ensureIsNewUser(req)
    .then(generateUser.bind(null, req))
    .then(function(user) {
      return Promise.all([
        usersRepo.createAsync(user),
        sendEmail(user)
      ]);
    })
    .then(function() {
      res.status(204).end();
    })
    .catch(UserAlreadyActivatedError, function(err) {
      res.status(422).send(err.message);
    })
    .catch(function(err) {
      return void next(err);
    });
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
      return getSaltedHash(salt, req.body.password);
    }),
    answerHash = Promise.join(answerSalt, function (salt) {
      return getSaltedHash(salt, req.body.answer);
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
    createdTimestamp: Date.now()
  });
}

function sendEmail(user) {
  var activationUrl = config.baseUrl + 'activate/' + encodeURIComponent(user.activationCode);
  var smtpTransport = require('nodemailer-smtp-transport');
  var transporter = Promise.promisifyAll(mailer.createTransport(smtpTransport(config.email.transport)));
  var html =
    '<html>' +
    ' <body>' +
    '  <p>To complete your account activation click on the following link:</p>' +
    '  <a href="' + activationUrl + '">' + activationUrl + '</a>' +
    ' </body>' +
    '</html>';
  var mailOptions = {
    from: config.email.fromAddress,
    to: user.username,
    subject: 'Activate your account',
    html: html
  };
  return transporter.sendMailAsync(mailOptions);
}

function getRandomBytes() {
  return crypto.randomBytesAsync(32);
}

function getSaltedHash(salt, payload) {
  return new Promise(function(resolve, reject) {
    var chunks = [];
    var hash = crypto.createHash('sha256')
      .on('error', reject)
      .on('data', function(chunk) {
        chunks.push(chunk);
      })
      .on('end', function() {
        resolve(Buffer.concat(chunks));
      });
    hash.write(salt);
    hash.end(payload);
  });
}

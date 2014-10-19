"use strict";

module.exports = {
  addRoutes: function(app) {
    app.post('/api/users', handleUsersPost);
    app.get('/api/users/:username', handleGetUser);
  }
};

var crypto = require('crypto');
var q = require('q');
var async = require('async');
var config = require('../config').settings;
var validator = require('../../common/validator');
var mailer = require('nodemailer');

function handleUsersPost(req, res, next) {

  if (!validator.isEmailAddress(req.body.username)) {
    return void res.status(422).send('You must provide a valid email address');
  }

  async.auto({
    passwordSalt: getRandomBytes,
    answerSalt: getRandomBytes,
    activationCodeBytes: getRandomBytes,
    activationCode: ['activationCodeBytes', function(next, results) {
      next(null, results.activationCodeBytes.toString('hex'));
    }],
    passwordHash: ['passwordSalt', function(next, results) {
      getSaltedHash(results.passwordSalt, req.body.password, next);
    }],
    answerHash: ['answerSalt', function(next, results) {
      getSaltedHash(results.answerSalt, req.body.answer, next);
    }],
    storeRegistration: [
      'passwordSalt', 'passwordHash', 'answerSalt', 'answerHash', 'activationCode',
      function(next, results) {
        var registration = {
          id: require('node-uuid').v4(),
          username: req.body.username,
          status: require('../enums/account-status').pending,
          passwordSalt: results.passwordSalt,
          passwordHash: results.passwordHash,
          securityQuestion: req.body.question,
          securityAnswerSalt: results.answerSalt,
          securityAnswerHash: results.answerHash,
          activationCode: results.activationCode,
          createdTimestamp: Date.now()
        };
        require('../repositories').repositories.users.create([registration], next);
      }
    ],
    sendEmail: ['activationCode', function(next, results) {
      var activationUrl = config.baseUrl + 'api/registrations/' + results.activationCode + '/activate';
      var smtpTransport = require('nodemailer-smtp-transport');
      var transporter = mailer.createTransport(smtpTransport(config.email.transport));
      var html =
        '<html>' +
        ' <body>' +
        '  <p>To complete your account activation click on the following link:</p>' +
        '  <a href="' + activationUrl + '">' + activationUrl + '</a>' +
        ' </body>' +
        '</html>';
      var mailOptions = {
        from: config.email.fromAddress,
        to: req.body.username,
        subject: 'Activate your account',
        html: html
      };
      transporter.sendMail(mailOptions, next);
    }]
  }, function(err) {
    if (err) {
      return void next(err);
    }

    res.status(204).end();
  });
}

function handleGetUser(req, res, next) {
  var users = require('../repositories').repositories.users;

  var dfd = q.defer();
  users.find({ username: req.params.username }, dfd.makeNodeResolver());
  dfd.promise
    .then(function(users) {
      if (users.length) {
        res.json({ username: users[0].username });
      } else {
        res.status(404).end();
      }
    })
    .fail(next);
}

function getRandomBytes(next) {
  crypto.randomBytes(32, next);
}

function getSaltedHash(salt, payload, next) {
  var chunks = [];
  var hash = crypto.createHash('sha256')
    .on('error', next)
    .on('data', function(chunk) {
      chunks.push(chunk);
    })
    .on('end', function() {
      next(null, Buffer.concat(chunks));
    });
  hash.write(salt);
  hash.end(payload);
}

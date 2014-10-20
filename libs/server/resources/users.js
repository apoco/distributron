"use strict";

module.exports = {
  addRoutes: function(app) {
    app.post('/api/users', handleUsersPost);
  }
};

var crypto = require('crypto');
var async = require('async');
var config = require('../config').settings;
var validator = require('../../common/validator');
var mailer = require('nodemailer');

function handleUsersPost(req, res, next) {

  if (!validator.isEmailAddress(req.body.username)) {
    return void res.status(422).send('You must provide a valid email address');
  }

  async.auto({
    user: generateUser.bind(null, req),
    store: ['user', function(next, results) {
      require('../data').repositories.users.create([results.user], next);
    }],
    sendEmail: ['user', function(next, results) {
      sendEmail(results.user, next);
    }]
  }, function(err) {
    if (err) {
      return void next(err);
    }

    res.status(204).end();
  });
}

function generateUser(req, cb) {
  async.auto({
    passwordSalt: getRandomBytes,
    answerSalt: getRandomBytes,
    activationCodeBytes: getRandomBytes,
    activationCode: ['activationCodeBytes', function (next, results) {
      next(null, results.activationCodeBytes.toString('hex'));
    }],
    passwordHash: ['passwordSalt', function (next, results) {
      getSaltedHash(results.passwordSalt, req.body.password, next);
    }],
    answerHash: ['answerSalt', function (next, results) {
      getSaltedHash(results.answerSalt, req.body.answer, next);
    }]
  }, function(err, results) {
    if (err) {
      return void cb(err);
    }

    var user = {
      id: require('node-uuid').v4(),
      username: req.body.username,
      status: require('../enums/user-status').pending,
      passwordSalt: results.passwordSalt,
      passwordHash: results.passwordHash,
      securityQuestion: req.body.question,
      securityAnswerSalt: results.answerSalt,
      securityAnswerHash: results.answerHash,
      activationCode: results.activationCode,
      createdTimestamp: Date.now()
    };
    cb(null, user);
  });
}

function sendEmail(user, cb) {
  var activationUrl = config.baseUrl + 'activate/' + encodeURIComponent(user.activationCode);
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
    to: user.username,
    subject: 'Activate your account',
    html: html
  };
  transporter.sendMail(mailOptions, cb);
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

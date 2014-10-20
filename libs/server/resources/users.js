"use strict";

module.exports = {
  addRoutes: function(app) {
    app.post('/api/users', handleUsersPost);
  }
};

var crypto = require('crypto');
var q = require('q');
var async = require('async');
var mailer = require('nodemailer');
var config = require('../config').settings;
var validator = require('../../common/validator');
var status = require('../enums/user-status');
var usersRepo = require('../data').repositories.users;

function handleUsersPost(req, res, next) {

  if (!validator.isEmailAddress(req.body.username)) {
    return void res.status(422).send('You must provide a valid email address');
  }

  async.auto({
    ensureIsNewUser: ensureIsNewUser.bind(null, req),
    user: generateUser.bind(null, req),
    store: ['user', function(next, results) {
      usersRepo.create([results.user], next);
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

function ensureIsNewUser(req, cb) {
  findUsername(req.body.username)
    .then(function(users) {
      var user = users[0];
      if (user) {
        if (user.status === status.pending) {
          return user.remove(cb);
        } else {
          throw { message: 'This account is already activated', status: 422 };
        }
      }
    })
    .nodeify(cb);
}

function findUsername(username) {
  var dfd = q.defer();
  usersRepo.find({ username: username }, dfd.makeNodeResolver());
  return dfd.promise;
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
      status: status.pending,
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

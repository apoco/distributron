'use strict';

module.exports = {
  addRoutes: function(app) {
    app.post('/api/activations', handleActivationPost);
  }
};

var Promise = require('bluebird');
var usersRepo = Promise.promisifyAll(require('../data').repositories.users);
var status = require('../enums/user-status');
var NotFoundError = require('../errors/not-found');

function handleActivationPost(req, res, next) {
  if (!req.body.code) {
    return void res.status(422).send('Missing activation code');
  }

  var user;
  usersRepo.findAsync({ activationCode: req.body.code })
    .get(0)
    .then(function(dbUser) {
      user = dbUser;

      if (!user) {
        throw new NotFoundError();
      }

      if (user.status === status.pending) {
        user.activatedTimestamp = new Date().toISOString();
        user.status = status.active;
        return Promise.promisify(user.save, user).call();
      }
    })
    .then(function() {
      res.location('/api/users/' + encodeURIComponent(user.username));
      res.status(201).json({ username: user.username });
    })
    .catch(NotFoundError, function(err) {
      res.status(422).send('Invalid activation code');
    })
    .catch(next);
}

'use strict';

module.exports = {
  addRoutes: function(app) {
    app.post('/api/activations', handleActivationPost);
  }
};

var async = require('async');
var usersRepo = require('../data').repositories.users;

function handleActivationPost(req, res, next) {
  if (!req.body.code) {
    return void res.status(422).send('Missing activation code');
  }

  var user;
  async.waterfall([
    function(next) {
      usersRepo.find({ activationCode: req.body.code }, next);
    },
    function(users, next) {
      if (!users.length) {
        return void res.status(422).send('Invalid activation code');
      }

      user = users[0];
      user.activatedTimestamp = Date.now();
      user.status = require('../enums/user-status').active;
      user.save(next);
    }
  ], function(err) {
    if (err) {
      return void next(err);
    }

    res.redirect('/api/users/' + encodeURIComponent(user.username));
  })
}

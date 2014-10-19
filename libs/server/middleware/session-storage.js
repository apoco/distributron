'use strict';

module.exports = startSessionStorage;

function startSessionStorage(req, res, next) {
  require('continuation-local-storage').createNamespace('session').run(function() {
    next();
  });
}

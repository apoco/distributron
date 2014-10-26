'use strict';

module.exports = {
  checkIfExists: checkIfExists
};

var Promise = require('bluebird');
var reqwest = require('reqwest');

function checkIfExists(username) {
  return Promise.resolve(reqwest({ method: 'head', url: '/api/users/' + encodeURIComponent(username) }));
}

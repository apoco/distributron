'use strict';

module.exports = {
  getByUsername: getByUsername
};

var Promise = require('bluebird');
var reqwest = require('reqwest');

function getByUsername(username) {
  return Promise.resolve(reqwest({ url: '/api/users/' + encodeURIComponent(username) }));
}

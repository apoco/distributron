'use strict';

module.exports = {
  getSaltedHash: getSaltedHash
};

var Promise = require('bluebird');
var crypto = require('crypto');

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

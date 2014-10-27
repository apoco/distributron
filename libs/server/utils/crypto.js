'use strict';

module.exports = {
  getSaltedHash: getSaltedHash,
  validateHashedValue: validateHashedValue
};

var Promise = require('bluebird');
var crypto = require('crypto');
var bufferTools = require('buffertools');

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

function validateHashedValue(salt, testValue, actualHash) {
  return getSaltedHash(salt, testValue)
    .then(function(hash) {
      return bufferTools.compare(hash, actualHash) === 0;
    });
}

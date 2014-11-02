'use strict';

var Promise = require('bluebird');
var inherits = require('util').inherits;
var RestObject = require('./rest-object');

inherits(DistributronAPI, RestObject);

function DistributronAPI() {
  RestObject.call(this, '/api');
  this.users = this.collection('users');
  this.tokens = this.collection('tokens');
}

module.exports = new DistributronAPI();

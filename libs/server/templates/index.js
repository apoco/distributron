'use strict';

module.exports = {
  get: get
};

var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var handlebars = require('handlebars');
var cache = {};

function get(name) {
  if (name in cache) {
    return Promise.resolve(cache[name]);
  }

  return fs
    .readFileAsync(path.resolve(__dirname, './' + name + '.html'), { encoding: 'utf8' })
    .then(function(contents) {
      return cache[name] = handlebars.compile(contents);
    });
}

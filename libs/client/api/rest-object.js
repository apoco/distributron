'use strict';

module.exports = RestObject;

var Promise = require('bluebird');
var reqwest = require('reqwest');

function RestObject(path) {
  this.path = path;
}

RestObject.prototype.collection = function(subPath) {
  var RestCollection = require('./rest-collection');
  return new RestCollection(this.path + '/' + encodeURIComponent(subPath));
};

RestObject.prototype.property = function(property) {
  return new RestObject(this.path + '/' + encodeURIComponent(property));
};

RestObject.prototype.head = function(data) {
  return this.request('head', data);
};

RestObject.prototype.get = function(data) {
  return this.request('get', data);
};

RestObject.prototype.post = function(data) {
  return this.request('post', data);
};

RestObject.prototype.put = function(data) {
  return this.request('put', data);
};

RestObject.prototype['delete'] = function(data) {
  return this.request('delete', data);
};

RestObject.prototype.request = function(method, data) {
  return Promise.resolve(reqwest({
    url: this.path,
    method: method,
    data: data && JSON.stringify(data),
    type: 'json',
    contentType: 'application/json'
  }));
};

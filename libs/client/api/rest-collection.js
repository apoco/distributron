'use strict';

module.exports = RestCollection;

var util = require('util');
var RestObject = require('./rest-object');

util.inherits(RestCollection, RestObject);

function RestCollection(path) {
  RestObject.call(this, path);
}

RestCollection.prototype.item = function(id) {
  return this.property(id);
};

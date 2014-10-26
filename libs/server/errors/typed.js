'use strict';

module.exports = createTypedError;

function createTypedError(name) {

  var constructor = function(message, inner) {
    this.name = name;
    this.message = message;
    this.inner = inner;
    Error.captureStackTrace(this, constructor);
  };

  constructor.prototype = Object.create(Error.prototype);
  constructor.prototype.constructor = constructor;

  return constructor;
}

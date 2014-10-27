'use strict';

module.exports = createTypedError;

function createTypedError(name, httpStatus) {

  var constructor = function(message, inner) {
    this.message = message;
    this.inner = inner;
    Error.captureStackTrace(this, constructor);
  };

  constructor.prototype = Object.create(Error.prototype);
  constructor.prototype.constructor = constructor;
  constructor.prototype.name = name;
  constructor.prototype.status = httpStatus || 500;

  return constructor;
}

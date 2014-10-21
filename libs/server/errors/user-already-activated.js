'use strict';

module.exports = UserAlreadyActivatedError;

function UserAlreadyActivatedError(message) {
  this.message = message;
  this.name = "UserAlreadyActivatedError";
  Error.captureStackTrace(this, UserAlreadyActivatedError);
}
UserAlreadyActivatedError.prototype = Object.create(Error.prototype);
UserAlreadyActivatedError.prototype.constructor = UserAlreadyActivatedError;

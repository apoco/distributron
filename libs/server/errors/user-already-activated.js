'use strict';

var TypedError = require('./typed');

module.exports = new TypedError('UserAlreadyActivatedError', 422);

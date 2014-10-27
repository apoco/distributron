'use strict';

var TypedError = require('./typed');

module.exports = new TypedError('AuthenticationError', 401);

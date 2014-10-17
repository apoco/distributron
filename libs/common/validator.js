"use strict";

var validator = require('validator');

module.exports = {
  isEmailAddress: validator.isEmail.bind(validator)
};

'use strict';

module.exports = EmailRule;

var isEmailAddress = require('../../../common/validator').isEmailAddress;

function EmailRule(field, message) {
  return {
    message: message,
    isValid: function() {
      return isEmailAddress(this.state[field]);
    }
  };
}

'use strict';

module.exports = RequiredRule;

function RequiredRule(field, message) {
  return {
    message: message,
    isValid: function() {
      return !!this.state[field];
    }
  };
}

'use strict';

module.exports = FieldsMatchRule;

function FieldsMatchRule(field1, field2, message) {
  return {
    message: message,
    isValid: function() { return this.state[field1] === this.state[field2]; }
  }
}
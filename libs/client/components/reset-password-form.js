'use strict';

var React = require('react');
var AjaxForm = require('./ajax-form');
var strings = require('../strings');
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');
var users = require('../repositories/users');

module.exports = React.createClass({
  render: function() {
    return React.DOM.div(null,
      React.DOM.p(null, strings.passwordResetFormInstructionsStep1),
      AjaxForm({
        fields: [
          {
            name: 'username',
            type: 'email',
            label: 'Email address',
            rules: [
              new IsRequiredRule('username', strings.emailAddressRequiredValidationMessage),
              new IsEmailRule('username', strings.emailAddressValidationMessage),
              {
                message: strings.unknownUsernameValidationMessage,
                isValid: function() {
                  return users.getByUsername(this.state.username)
                    .then(function(user) {
                      return true;
                    })
                    .catch(function() {
                      return false;
                    });
                }
              }
            ]
          }
        ],
        submitLabel: strings.passwordResetStep1SubmitLabel
      })
    );
  }
});

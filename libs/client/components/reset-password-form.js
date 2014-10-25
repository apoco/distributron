'use strict';

var React = require('react');
var AjaxForm = require('./ajax-form');
var strings = require('../strings');
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');

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
              new IsEmailRule('username', strings.emailAddressValidationMessage)
            ]
          }
        ],
        submitLabel: strings.passwordResetStep1SubmitLabel
      })
    );
  }
});

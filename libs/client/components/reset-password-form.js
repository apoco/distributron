'use strict';

var React = require('react');
var AjaxForm = require('./ajax-form');
var strings = require('../strings');
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');
var users = require('../repositories/users');

module.exports = React.createClass({
  getInitialState: function() {
    return { hasSubmittedUsername: false, hasResetPassword: false };
  },
  handleFieldChange: function(e) {
    if (e.field === 'username') {
      this.setState({ username: e.value });
    }
  },
  validateUserExists: function() {
    if (!this.state.username) {
      return true;
    }

    return users.checkIfExists(this.state.username)
      .then(function() {
        return true;
      })
      .catch(function() {
        return false;
      });
  },
  getSecurityQuestionUrl: function() {
    return '/api/users/' + encodeURIComponent(this.state.username) + '/question';
  },
  handleSecurityQuestion: function(question) {
    this.setState({ hasSubmittedUsername: true, securityQuestion: question });
  },
  handlePasswordReset: function() {
    this.setState({ hasResetPassword: true });
  },
  renderStep1: function() {
    return [
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
                isValid: this.validateUserExists
              }
            ]
          }
        ],
        submitLabel: strings.passwordResetStep1SubmitLabel,
        method: 'get',
        data: null,
        url: this.getSecurityQuestionUrl,
        onChange: this.handleFieldChange,
        onAfterSubmit: this.handleSecurityQuestion
      })
    ];
  },
  renderStep2: function() {
    return [
      React.DOM.p(null, strings.passwordResetFormInstructionsStep2),
      AjaxForm({
        fields: [
          {
            name: 'answer',
            type: 'password',
            label: this.state.securityQuestion,
            rules: [ new IsRequiredRule('answer', strings.securityAnswerRequiredValidationMessage) ]
          }
        ],
        submitLabel: strings.passwordResetStep2SubmitLabel,
        url: this.getSecurityQuestionUrl,
        onAfterSubmit: this.handlePasswordReset
      })
    ];
  },
  render: function() {
    var formContent;
    if (!this.state.hasSubmittedUsername) {
      formContent = this.renderStep1();
    } else if (!this.state.hasResetPassword) {
      formContent = this.renderStep2();
    } else {
      formContent = React.DOM.p(null, strings.resetPasswordSuccessMessage);
    }

    return React.DOM.div(null, formContent);
  }
});

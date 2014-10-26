'use strict';

var React = require('react');
var AjaxForm = require('./ajax-form');
var strings = require('../strings');
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');
var users = require('../repositories/users');

module.exports = React.createClass({
  getInitialState: function() {
    return { hasSubmittedUsername: false };
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
  getPasswordResetUrl: function() {
    return '/api/users/' + encodeURIComponent(this.state.username) + '/answer';
  },
  handleSecurityQuestion: function(question) {
    this.setState({ hasSubmittedUsername: true, securityQuestion: question });
  },
  handlePasswordReset: function() {

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
        url: this.getPasswordResetUrl,
        onAfterSubmit: this.handlePasswordReset
      })
    ];
  },
  render: function() {
    var formContent = this.state.hasSubmittedUsername
      ? this.renderStep2()
      : this.renderStep1();
    return React.DOM.div(null, formContent);
  }
});

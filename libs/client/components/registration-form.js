"use strict";

var Promise = require('bluebird');
var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;
var users = require('../repositories/users');
var validator = require('../../common/validator');
var strings = require('../strings');
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');
var usernameExistsCache = {};

var fields = [
  {
    name: 'username',
    type: 'email',
    label: 'Email address',
    rules: [
      new IsRequiredRule('username', strings.emailAddressRequiredValidationMessage),
      new IsEmailRule('username', strings.emailAddressValidationMessage),
      {
        message: 'There is already an account using this email address',
        isValid: function() {
          if (!this.state.username) {
            return true;
          }

          if (this.state.username in usernameExistsCache) {
            return usernameExistsCache[this.state.username]
          }

          var self = this;
          return users.checkIfExists(this.state.username)
            .then(function() {
              // We got back a success message, so the user exists and the username is in use.
              return usernameExistsCache[self.state.username] = false;
            })
            .catch(function() {
              return usernameExistsCache[self.state.username] = true;
            });
        }
      }
    ]
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    rules: [
      new IsRequiredRule('password', strings.passwordRequiredValidationMessage)
    ]
  },
  {
    name: 'confirm',
    type: 'password',
    label: 'Re-enter password',
    rules: [
      {
        message: 'Your passwords do not match',
        isValid: function() { return this.state.password === this.state.confirm; }
      }
    ]
  },
  {
    name: 'question',
    type: 'text',
    label: 'Password reset question',
    rules: [
      new IsRequiredRule('question', strings.securityQuestionRequiredValidationMessage)
    ]
  },
  {
    name: 'answer',
    type: 'password',
    label: 'Password reset answer',
    rules: [
      new IsRequiredRule('answer', strings.securityAnswerRequiredValidationMessage)
    ]
  }
];

module.exports = React.createClass({
  displayName: 'RegistrationForm',
  getInitialState: function() {
    return { submitted: false };
  },
  handleSuccess: function() {
    this.setState({ submitted: true });
  },
  render: function() {
    return (this.state.submitted
      ? React.DOM.p(null, require('../strings').registrationSuccessMessage)
      : React.DOM.div({ id: 'registration-form' },
        AjaxForm({
          fields: fields,
          url: '/api/users/',
          onAfterSubmit: this.handleSuccess
        }),
        Link({ to: 'login' }, 'I already have an account')));
  }
});

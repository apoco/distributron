'use strict';

var React = require('react');
var AjaxForm = require('./ajax-form');
var tr = require('../localization').translate;
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');
var FieldsMatchRule = require('../forms/rules/fields-match');
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
      React.DOM.p(null, tr('To reset your password, first enter your email address.')),
      AjaxForm({
        fields: [
          {
            name: 'username',
            type: 'email',
            label: tr('Email address'),
            rules: [
              new IsRequiredRule('username', tr('You must enter an email address')),
              new IsEmailRule('username', tr('Invalid email address')),
              {
                message: tr("We don't have that email address on file; perhaps you're not yet registered"),
                isValid: this.validateUserExists
              }
            ]
          }
        ],
        submitLabel: tr('Next'),
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
      React.DOM.p(null, tr('Now answer your password reset question.')),
      AjaxForm({
        fields: [
          {
            name: 'answer',
            type: 'password',
            label: this.state.securityQuestion,
            rules: [ new IsRequiredRule('answer', tr('You must enter a password reset answer')) ]
          }
        ],
        submitLabel: tr('Submit'),
        url: this.getSecurityQuestionUrl,
        onAfterSubmit: this.handlePasswordReset
      })
    ];
  },
  renderNewPasswordForm: function() {
    return [
      React.DOM.p(null, tr('Enter your new password to complete your password reset.')),
      AjaxForm({
        fields: [
          {
            name: 'old',
            type: 'password',
            label: tr('Current password'),
            defaultValue: this.props.query.password,
            rules: [ new IsRequiredRule('old', tr('You must provide your current password')) ]
          },
          {
            name: 'password',
            type: 'password',
            label: tr('New password'),
            rules: [ new IsRequiredRule('password', tr('You must enter a password')) ]
          },
          {
            name: 'confirm',
            type: 'password',
            label: tr('Re-enter password'),
            rules: [ new FieldsMatchRule('password', 'confirm', tr('Your passwords do not match')) ]
          }
        ],
        submitLabel: tr('Submit'),
        url: this.getSecurityQuestionUrl,
        onAfterSubmit: this.handlePasswordReset
      })
    ];
  },
  render: function() {
    var formContent;
    if (this.props.params.username) {
      formContent = this.renderNewPasswordForm();
    } else if (!this.state.hasSubmittedUsername) {
      formContent = this.renderStep1();
    } else if (!this.state.hasResetPassword) {
      formContent = this.renderStep2();
    } else {
      formContent = React.DOM.p(
        null,
        tr('Your reset request has been accepted. You should receive an email with your temporary password shortly.'));
    }

    return React.DOM.div(null, formContent);
  }
});

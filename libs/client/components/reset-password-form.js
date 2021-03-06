'use strict';

var React = require('react');
var Router = require('react-router');
var Link = Router.Link;
var AjaxForm = require('./ajax-form');
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');
var FieldsMatchRule = require('../forms/rules/fields-match');
var users = require('../repositories/users');

module.exports = React.createClass({
  displayName: 'ResetPasswordForm',
  mixins: [ Router.Navigation ],
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
  handleSecurityQuestion: function(question) {
    this.setState({ hasSubmittedUsername: true, securityQuestion: question });
  },
  handlePasswordReset: function() {
    this.setState({ hasResetPassword: true });
  },
  handleChangedPassword: function() {
    this.setState({ hasChangedPassword: true });
  },
  handleFormReset: function() {
    this.setState({ hasSubmittedUsername: false });
  },
  renderStep1: function() {
    var tr = require('../localization').getTranslator();
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
        action: users.getSecurityQuestion.bind(users, this.state.username),
        onChange: this.handleFieldChange,
        onAfterSubmit: this.handleSecurityQuestion
      })
    ];
  },
  renderStep2: function() {
    var tr = require('../localization').getTranslator();
    return [
      React.DOM.p(null, tr('Now answer your password reset question.')),
      AjaxForm({
        fields: [
          {
            name: 'username',
            type: 'hidden',
            defaultValue: this.state.username
          },
          {
            name: 'answer',
            type: 'password',
            label: this.state.securityQuestion,
            rules: [ new IsRequiredRule('answer', tr('You must enter a password reset answer')) ]
          }
        ],
        buttons: [{ id: 'reset', label: tr('Reset'), onClick: this.handleFormReset }],
        submitLabel: tr('Submit'),
        action: users.resetPassword.bind(users),
        onAfterSubmit: this.handlePasswordReset
      })
    ];
  },
  renderNewPasswordForm: function() {
    var tr = require('../localization').getTranslator();
    return [
      React.DOM.p(null, tr('Enter your new password to complete your password reset.')),
      AjaxForm({
        fields: [
          {
            name: 'username',
            type: 'hidden',
            defaultValue: this.props.params.username
          },
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
        action: users.setPassword.bind(users),
        onAfterSubmit: this.handleChangedPassword
      })
    ];
  },
  render: function() {
    var tr = require('../localization').getTranslator();
    var formContent;
    if (this.props.params.username) {
      if (this.state.hasChangedPassword) {
        formContent = React.DOM.p(null, tr('Your password has been changed.'));
      } else {
        formContent = this.renderNewPasswordForm();
      }
    } else if (!this.state.hasSubmittedUsername) {
      formContent = this.renderStep1();
    } else if (!this.state.hasResetPassword) {
      formContent = this.renderStep2();
    } else {
      formContent = React.DOM.p(
        null,
        tr('Your reset request has been accepted. You should receive an email with your temporary password shortly.'));
    }

    return React.DOM.div(null,
      formContent,
      React.DOM.nav(null,
        Link({ to: 'login' }, tr('Login')),
        Link({ to: 'register' }, tr('Register an account'))));
  }
});

"use strict";

var Promise = require('bluebird');
var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;
var users = require('../repositories/users');
var validator = require('../../common/validator');
var tr = require('../localization').translate;
var IsRequiredRule = require('../forms/rules/required');
var IsEmailRule = require('../forms/rules/email');
var FieldsMatchRule = require('../forms/rules/fields-match');
var usernameExistsCache = {};

var fields = [
  {
    name: 'username',
    type: 'email',
    label: tr('Email address'),
    rules: [
      new IsRequiredRule('username', tr('You must enter an email address')),
      new IsEmailRule('username', tr('Invalid email address')),
      {
        message: tr('There is already an account using this email address'),
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
    label: tr('Password'),
    rules: [
      new IsRequiredRule('password', tr('You must enter a password'))
    ]
  },
  {
    name: 'confirm',
    type: 'password',
    label: tr('Re-enter password'),
    rules: [ new FieldsMatchRule('password', 'confirm', tr('Your passwords do not match')) ]
  },
  {
    name: 'question',
    type: 'text',
    label: tr('Password reset question'),
    rules: [ new IsRequiredRule('question', tr('You must enter a password reset question')) ]
  },
  {
    name: 'answer',
    type: 'password',
    label: tr('Password reset answer'),
    rules: [
      new IsRequiredRule('answer', tr('You must enter a password reset answer'))
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
      ? React.DOM.p(null, tr('Your registration has been submitted. You should receive your activation email shortly.'))
      : React.DOM.div({ id: 'registration-form' },
        AjaxForm({
          fields: fields,
          url: '/api/users/',
          onAfterSubmit: this.handleSuccess
        }),
        Link({ to: 'login' }, tr('I already have an account'))));
  }
});

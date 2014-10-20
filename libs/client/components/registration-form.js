"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;
var reqwest = require('reqwest');
var validator = require('../../common/validator');

var usernameExistsCache = {};

var fields = [
  {
    name: 'username',
    type: 'email',
    label: 'Email address',
    rules: [
      {
        isValid: function() { return !!this.state.username; },
        message: 'You must enter an email address'
      },
      {
        isValid: function() { return validator.isEmailAddress(this.state.username); },
        message: 'Invalid email address'
      },
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
          return reqwest({ url: '/api/users/' + encodeURIComponent(this.state.username) })
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
      {
        message: 'You must enter a password',
        isValid: function() { return !!this.state.password; }
      }
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
      {
        message: 'You must enter a password reset question',
        isValid: function() { return !!this.state.question; }
      }
    ]
  },
  {
    name: 'answer',
    type: 'password',
    label: 'Password reset answer',
    rules: [
      {
        message: 'You must enter a password reset answer',
        isValid: function() { return !!this.state.answer; }
      }
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

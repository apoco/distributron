"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;

var validator = require('../../common/validator');

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
  render: function() {
    return React.DOM.div(null,
      AjaxForm({
        fields: fields,
        url: '/api/registrations/'
      }),
      Link({ to: 'login' }, 'I already have an account'));
  }
});

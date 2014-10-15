"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Field = require('./field');
var Link = require('react-router').Link;

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
        isValid: function() { return /[^@]+@[^@]+/.test(this.state.username); },
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
  getInitialState: function() {
    return {
      username: '',
      password: '',
      confirmedPassword: '',
      securityQuestion: '',
      securityAnswer: '',
      submitted: false
    };
  },
  handleChange: function(field, e) {
    var change = { };
    change[field] = e.target.value.replace(/^\s+|\s+$/g, '');
    change[field + 'Changed'] = true;
    this.setState(change);
  },
  validate: function(field) {
    var rules = field.rules || [];
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (this.state[field.name + 'Changed'] && !rule.isValid.call(this)) {
        return rule.message;
      }
    }
  },
  renderFields: function() {
    var self = this;
    return fields.map(function(field) {
      return Field({
        name: field.name,
        label: field.label,
        type: field.type,
        value: self.state[field.name],
        validationMessage: self.validate.call(self, field),
        onChange: self.handleChange.bind(self, field.name)
      });
    });
  },
  render: function() {
    return React.DOM.div(null,
      AjaxForm(null, this.renderFields()),
      Link({ to: 'login' }, 'I already have an account'));
  }
});

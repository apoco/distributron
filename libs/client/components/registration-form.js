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
      }
    ]
  },
  { name: 'password', type: 'password', label: 'Password' },
  { name: 'confirm', type: 'password', label: 'Re-enter password' },
  { name: 'question', type: 'text', label: 'Password reset question' },
  { name: 'answer', type: 'password', label: 'Password reset answer' }
];

module.exports = React.createClass({
  displayName: 'RegistrationForm',
  getInitialState: function() {
    return {
      username: '',
      password: '',
      confirmedPassword: '',
      securityQuestion: '',
      securityAnswer: ''
    };
  },
  handleChange: function(field, e) {
    var change = {};
    change[field] = e.target.value.replace(/^\s+|\s+$/g, '');
    this.setState(change);
  },
  validate: function(field) {
    var rules = field.rules || [];
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (!rule.isValid.call(this)) {
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

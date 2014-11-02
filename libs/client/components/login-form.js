"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;
var Navigation = require('react-router').Navigation;
var IsRequiredRule = require('../forms/rules/required');
var tr = require('../localization').translate;
var users = require('../repositories/users');

module.exports = React.createClass({
  displayName: 'LoginForm',
  mixins: [ Navigation ],

  handleFieldChange: function(change) {
    if (change.field === 'username') {
      this.setState({ username: change.value });
    }
  },

  handleLogin: function(token) {
    this.transitionTo('dashboard');
  },

  render: function() {
    return React.DOM.div(null,
      AjaxForm({
        action: users.login.bind(users),
        onChange: this.handleFieldChange,
        onAfterSubmit: this.handleLogin,
        fields: [
          {
            name: 'username',
            type: 'email',
            label: tr('Email address'),
            rules: [ new IsRequiredRule('username', tr('You must enter your email address')) ]
          },
          {
            name: 'password',
            type: 'password',
            label: tr('Password'),
            rules: [ new IsRequiredRule('password', tr('You must enter your password')) ]
          }
        ]
      }),
      React.DOM.nav(null,
        Link({ to: 'register' }, tr('Create a login')),
        Link({ to: 'reset-password' }, tr('Reset my password'))
      ));
  }
});

"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;
var strings = require('../strings');

module.exports = React.createClass({
  displayName: 'LoginForm',
  render: function() {
    return React.DOM.div(null,
      AjaxForm({
        fields: [
          {
            name: 'username',
            type: 'email',
            label: strings.loginFormUsernameLabel
          },
          {
            name: 'password',
            type: 'password',
            label: strings.loginFormPasswordLabel,
          }
        ]
      }),
      React.DOM.nav(null,
        Link({ to: 'register' }, strings.loginFormRegistrationLinkText),
        Link({ to: 'reset-password' }, strings.loginFormPasswordResetLinkText)
      ));
  }
});

"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');

module.exports = React.createClass({
  displayName: 'RegistrationForm',
  render: function() {
    return AjaxForm(null,
      React.DOM.label({ htmlFor: 'username' }, 'Email address:'),
      React.DOM.input({ id: 'username', name: 'username', type: 'email' }),
      React.DOM.label({ htmlFor: 'password' }, 'Password:'),
      React.DOM.input({ id: 'password', name: 'password', type: 'password' }),
      React.DOM.label({ htmlFor: 'confirm' }, 'Re-enter password:'),
      React.DOM.input({ id: 'confirm', name: 'confirm', type: 'password' }));
  }
});

"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;

module.exports = React.createClass({
  displayName: 'LoginForm',
  render: function() {
    return React.DOM.div(null,
      AjaxForm(null,
        React.DOM.label({ htmlFor: 'username'}, 'Email address:'),
        React.DOM.input({ id: 'username', name: 'username', type: 'text'}),
        React.DOM.label({ htmlFor: 'password'}, 'Password:'),
        React.DOM.input({ id: 'password', name: 'password', type: 'password'})),
      Link({ to: 'register' }, 'Create a login'));
  }
});

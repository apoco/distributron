"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;

module.exports = React.createClass({
  displayName: 'LoginForm',
  render: function() {
    return React.DOM.div(null,
      AjaxForm({
        fields: [
          {
            name: 'username',
            label: 'Email address',
            type: 'email'
          },
          {
            name: 'password',
            label: 'Password',
            type: 'password'
          }
        ]
      }),
      Link({ to: 'register' }, 'Create a login'));
  }
});

"use strict";

var React = require('react');
var AjaxForm = require('./ajax-form');
var Link = require('react-router').Link;
var tr = require('../localization').translate;

module.exports = React.createClass({
  displayName: 'LoginForm',
  render: function() {
    return React.DOM.div(null,
      AjaxForm({
        fields: [
          {
            name: 'username',
            type: 'email',
            label: tr('Email address')
          },
          {
            name: 'password',
            type: 'password',
            label: tr('Password')
          }
        ]
      }),
      React.DOM.nav(null,
        Link({ to: 'register' }, tr('Create a login')),
        Link({ to: 'reset-password' }, tr('Reset my password'))
      ));
  }
});

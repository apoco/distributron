"use strict";

var React = require('react');

module.exports = React.createClass({
  displayName: 'LoginForm',
  render: function() {
    return React.DOM.div(null,
      React.DOM.label({ htmlFor: 'username'}, 'Username:'),
      React.DOM.input({ id: 'username', name: 'username', type: 'text'}),
      React.DOM.label({ htmlFor: 'password'}, 'Password:'),
      React.DOM.input({ id: 'password', name: 'password', type: 'password'}));
  }
});

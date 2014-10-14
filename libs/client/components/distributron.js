"use strict";

var React = require('react');
var LoginForm = require('./login-form');

var Distributron = React.createClass({
  displayName: 'Distributron',
  render: function() {
    return LoginForm(null);
  }
});

React.renderComponent(
  Distributron(null),
  document.querySelector('body'));

module.exports = Distributron;
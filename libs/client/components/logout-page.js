'use strict';

var React = require('react');
var LoginForm = require('./login-form');
var reqwest = require('reqwest');
var users = require('../repositories/users');

module.exports = React.createClass({
  displayName: 'LogoutPage',
  getInitialState: function() {
    users.logout()
      .bind(this)
      .then(function() {
        this.setState({ isLoggingOut: false });
      });
    return { isLoggingOut: true };
  },
  render: function() {
    var tr = require('../localization').getTranslator();
    if (this.state.isLoggingOut) {
      return React.DOM.p(null, tr('Logging you out...'));
    } else {
      return React.DOM.div(null,
        React.DOM.p(null, tr('You have been logged out.')),
        LoginForm());
    }
  }
});

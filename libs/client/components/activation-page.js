'use strict';

var React = require('react');
var LoginForm = require('./login-form');
var reqwest = require('reqwest');
var tr = require('../localization').translate;
var strings = require('../strings');

module.exports = React.createClass({
  displayName: 'ActivationPage',
  getInitialState: function() {
    return {
      isActivating: true,
      username: null,
      isInvalidCode: false,
      hadInternalError: false,
      activatingPromise: this.activate()
    };
  },
  activate: function() {
    var self = this;
    return reqwest(
      {
        url: '/api/activations/',
        method: 'post',
        type: 'json',
        contentType: 'application/json',
        data: JSON.stringify({ code: self.props.params.code })
      })
      .then(function(user) {
        self.setState({ username: user.username });
      })
      .fail(function(err) {
        if (err.status === 422) {
          self.setState({ isInvalidCode: true });
        } else {
          self.setState({ hadInternalError: true });
        }
      })
      .always(function() {
        self.setState({ isActivating: false });
      });
  },
  render: function() {
    if (this.state.isActivating) {
      return React.DOM.div({ className: 'wait-message' }, tr('Activating your account...'));
    } else if (this.state.username) {
      return React.DOM.div(null,
        React.DOM.div(
          { className: 'success-message' },
          tr('Your account has been activated. Enter your email address and password to enter the site.')),
        LoginForm());
    } else if (this.state.isInvalidCode) {
      return React.DOM.div({ className: 'error-message' }, tr('Invalid access code'));
    } else {
      return React.DOM.div({ className: 'error-message' }, tr('Strange, something is not working right. Please try again later.'));
    }
  }
});

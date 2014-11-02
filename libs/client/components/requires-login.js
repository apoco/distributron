'use strict';

var React = require('react');
var Navigation = require('react-router').Navigation;
var users = require('../repositories/users');

module.exports = {
  mixins: [ Navigation ],
  componentDidMount: function() {
    if (!users.current) {
      this.transitionTo('login');
    }
  }
};

'use strict';

var React = require('react');

module.exports = React.createClass({
  displayName: 'Dashboard',
  mixins: [ require('./requires-login') ],
  render: function() {
    return React.DOM.div({ id: 'dashboard' });
  }
});
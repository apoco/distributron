"use strict";

var React = require('react');

module.exports = React.createClass({
  displayName: 'AjaxForm',
  handleSubmit: function(e) {
    e.preventDefault();
  },
  render: function() {
    return React.DOM.form({ onSubmit: this.handleSubmit },
      this.props.children,
      React.DOM.input({ type: 'submit', value: 'Submit' }));
  }
});

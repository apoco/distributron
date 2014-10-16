"use strict";

var React = require('react');

module.exports = React.createClass({
  displayName: 'AjaxForm',
  getDefaultProps: function() {
    return { canSubmit: true };
  },
  handleSubmit: function(e) {
    e.preventDefault();
  },
  render: function() {
    var submitProps = { type: 'submit', value: 'Submit' };
    if (!this.props.canSubmit) {
      submitProps.disabled = 'disabled';
    }
    return React.DOM.form({ onSubmit: this.handleSubmit },
      this.props.children,
      React.DOM.input(submitProps));
  }
});

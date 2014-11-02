"use strict";

var React = require('react');

var fieldCtr = 1;

module.exports = React.createClass({
  displayName: 'Field',
  getDefaultProps: function() {
    return { type: 'text', value: '', rules: [] };
  },
  render: function() {
    if (this.props.type === 'hidden') {
      return React.DOM.input({
        name: this.props.name,
        type: 'hidden',
        defaultValue: this.props.defaultValue });
    } else {
      var fieldId = 'field-' + (fieldCtr++);
      return React.DOM.div({ className: 'field' },
        React.DOM.label({ htmlFor: fieldId }, this.props.label),
        React.DOM.input({
          id: fieldId,
          name: this.props.name,
          type: this.props.type,
          defaultValue: this.props.defaultValue,
          onChange: this.props.onChange
        }),
        this.props.validationMessage && React.DOM.div({ className: 'error' }, this.props.validationMessage));
    }
  }
});

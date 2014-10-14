"use strict";

var React = require('react');

var fieldCtr = 1;

module.exports = React.createClass({
  displayName: 'Field',
  getDefaultProps: function() {
    return { type: 'text', value: '', rules: [] };
  },
  render: function() {
    var fieldId = 'field-' + (fieldCtr++);
    return React.DOM.div({ cssClass: 'field' },
      React.DOM.label({ htmlFor: fieldId }, this.props.label),
      React.DOM.input({
        id: fieldId,
        name: this.props.name,
        type: this.props.type,
        onChange: this.props.onChange
      }),
      this.props.validationMessage && React.DOM.div({ cssClass: 'error' }, this.props.validationMessage));
  }
});

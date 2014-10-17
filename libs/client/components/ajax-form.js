"use strict";

var React = require('react');
var Field = require('./field');
var reqwest = require('reqwest');

module.exports = React.createClass({
  displayName: 'AjaxForm',
  getInitialState: function() {
    return { submitted: false };
  },
  handleChange: function(field, e) {
    var change = { };
    change[field] = e.target.value.replace(/^\s+|\s+$/g, '');
    change[field + 'Changed'] = true;
    this.setState(change);
  },
  handleSubmit: function(e) {
    e.preventDefault();

    var payload = {};
    this.props.fields.forEach(function(field) {
      payload[field.name] = this.state[field.name];
    }.bind(this));

    reqwest(
      {
        url: this.props.url,
        method: 'post',
        type: 'json',
        contentType: 'application/json',
        data: JSON.stringify(payload)
      })
      .then(function() {

      })
      .fail(function() {

      });

    return false;
  },
  validate: function(field) {
    var rules = field.rules || [];
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (!rule.isValid.call(this)) {
        return rule.message;
      }
    }
  },
  renderFields: function(validationMessages) {
    var self = this;
    return this.props.fields.map(function(field) {
      return Field({
        key: field.name,
        name: field.name,
        label: field.label,
        type: field.type,
        value: self.state[field.name],
        validationMessage: validationMessages[field.name],
        onChange: self.handleChange.bind(self, field.name)
      });
    });
  },
  render: function() {
    var isValid = true;
    var validationMessages = {};
    this.props.fields.forEach(function(field) {
      var validationMsg = this.validate(field);
      isValid = isValid && !validationMsg;
      validationMessages[field.name] = this.state[field.name + 'Changed'] ? validationMsg : null;
    }.bind(this));

    var submitProps = { type: 'submit', value: 'Submit' };
    if (!isValid) {
      submitProps.disabled = 'disabled';
    }

    return React.DOM.form({ onSubmit: this.handleSubmit },
      this.renderFields(validationMessages),
      React.DOM.input(submitProps));
  }
});

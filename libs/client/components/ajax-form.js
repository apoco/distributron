"use strict";

var q = require('q');
var React = require('react');
var Field = require('./field');
var reqwest = require('reqwest');

module.exports = React.createClass({
  displayName: 'AjaxForm',
  getInitialState: function() {
    return {
      submitted: false,
      isValidating: true,
      validatingPromise: this.validate()
    };
  },
  validate: function() {
    var self = this;
    return ((self.state && self.state.validatingPromise) || q.resolve(null))
      .then(function() {
        self.setState({ isValidating: true });
        return q.all(self.props.fields.map(function(field) {
          var validationState = {};
          return self.validateField(field)
            .then(function() {
              validationState[field.name + 'ValidationMessage'] = null;
            })
            .fail(function(err) {
              validationState[field.name + 'ValidationMessage'] = err.message;
            })
            .finally(function() {
              self.setState(validationState);
            })
        }));
      })
      .then(function() {
        self.setState({ isValid: true });
      })
      .fail(function() {
        self.setState({ isValid: false });
      })
      .finally(function() {
        self.setState({ isValidating: false });
      });
  },
  validateField: function(field) {
    var self = this;

    return field.rules.reduce(function(prev, rule) {
      return prev
        .then(function() {
          return rule.isValid.call(self);
        })
        .then(function(isValid) {
          if (!isValid) {
            throw new Error(rule.message);
          }
        });
    }, q.resolve(null));
  },
  handleChange: function(field, e) {
    var change = { validatingPromise: this.validate() };
    change[field.name] = e.target.value.replace(/^\s+|\s+$/g, '');
    change[field.name + 'Changed'] = true;
    this.setState(change);
  },
  handleSubmit: function(e) {
    e.preventDefault();

    var payload = {};
    this.props.fields.forEach(function(field) {
      payload[field.name] = this.state[field.name];
    }.bind(this));

    this.setState({ isSubmitting: true });

    reqwest(
      {
        url: this.props.url,
        method: 'post',
        type: 'json',
        contentType: 'application/json',
        data: JSON.stringify(payload)
      })
      .then(function(res) {
        this.props.onAfterSubmit(res);
      }.bind(this))
      .fail(function() {
      })
      .always(function() {
        this.setState({ isSubmitting: false });
      }.bind(this));

    return false;
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
        onChange: self.handleChange.bind(self, field)
      });
    });
  },
  render: function() {
    var isValid = true, validationMessages = {};
    this.props.fields.forEach(function(field) {
      var msg = this.state[field.name + 'ValidationMessage'];
      isValid = isValid && !msg;
      validationMessages[field.name] = this.state[field.name + 'Changed'] ? msg : null;
    }.bind(this));

    var submitProps = { type: 'submit', value: 'Submit' };
    if (!isValid || this.state.isValidating || this.state.isSubmitting) {
      submitProps.disabled = 'disabled';
    }

    return React.DOM.form({ onSubmit: this.handleSubmit },
      this.renderFields(validationMessages),
      React.DOM.input(submitProps));
  }
});

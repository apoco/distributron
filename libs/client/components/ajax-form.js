"use strict";

var Promise = require('bluebird');
var React = require('react');
var Field = require('./field');
var reqwest = require('reqwest');
var ValidationError = require('../errors/validation');
var strings = require('../strings');

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
    return ((this.state && this.state.validatingPromise) || Promise.resolve(null))
      .then(function() {
        self.setState({ isValidating: true });
        return self.props.fields;
      })
      .map(function(field) {
        return self.validateField(field);
      })
      .all()
      .then(function() {
        self.setState({ isValid: true });
      })
      .catch(ValidationError, function() {
        self.setState({ isValid: false });
      })
      .finally(function() {
        self.setState({ isValidating: false });
      });
  },

  validateField: function(field) {
    return Promise
      .bind(this)
      .return(field.rules)
      .map(function(rule) {
        return this.validateRule(field.name, rule);
      })
      .all()
      .then(function() {
        var state = {};
        state[field.name + 'ValidationMessage'] = null;
        this.setState(state);
      });
  },

  validateRule: function(fieldName, rule) {
    var self = this;
    return Promise.resolve(rule.isValid.call(self))
      .then(function(isValid) {
        if (!isValid) {
          var state = {};
          state[fieldName + 'ValidationMessage'] = rule.message;
          self.setState(state);
          throw new ValidationError(rule.message);
        }
      });
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

    this.setState({ isSubmitting: true, hadSubmitError: false });

    Promise
      .bind(this)
      .return(reqwest({
        url: this.props.url,
        method: 'post',
        type: 'json',
        contentType: 'application/json',
        data: JSON.stringify(payload)
      }))
      .then(function(res) {
        this.props.onAfterSubmit(res);
      })
      .catch(function() {
        this.setState({ hadSubmitError: true });
      })
      .finally(function() {
        this.setState({ isSubmitting: false });
      });

    return false;
  },

  renderFields: function(validationMessages) {
    return this.props.fields.map(function(field) {
      return Field({
        key: field.name,
        name: field.name,
        label: field.label,
        type: field.type,
        value: this.state[field.name],
        validationMessage: validationMessages[field.name],
        onChange: this.handleChange.bind(this, field)
      });
    }.bind(this));
  },

  render: function() {
    var isValid = true, validationMessages = {};
    this.props.fields.forEach(function(field) {
      var msg = this.state[field.name + 'ValidationMessage'];
      isValid = isValid && !msg;
      validationMessages[field.name] = this.state[field.name + 'Changed'] ? msg : null;
    }.bind(this));

    var submitProps = { type: 'submit', value: this.props.submitLabel || 'Submit' };
    if (!isValid || this.state.isValidating || this.state.isSubmitting) {
      submitProps.disabled = 'disabled';
    }

    return React.DOM.form({ onSubmit: this.handleSubmit },
      this.renderFields(validationMessages),
      this.state.hadSubmitError
        ? React.DOM.div({ className: 'error' }, strings.unknownErrorMessage)
        : null,
      React.DOM.input(submitProps));
  }
});
"use strict";

var Promise = require('bluebird');
var React = require('react');
var Field = require('./field');
var reqwest = require('reqwest');
var ValidationError = require('../errors/validation');
var tr = require('../localization').translate;

module.exports = React.createClass({
  displayName: 'AjaxForm',

  getInitialState: function() {
    var state = {
      submitted: false,
      isValidating: true,
      validatingPromise: this.validate()
    };

    this.props.fields.forEach(function(field) {
      if (field.defaultValue) {
        state[field.name] = field.defaultValue;
      }
    });

    return state;
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
      .return(field.rules || [])
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
    var normalizedValue = e.target.value.replace(/^\s+|\s+$/g, '');
    change[field.name] = normalizedValue;
    change[field.name + 'Changed'] = true;
    this.setState(change);

    this.props.onChange && this.props.onChange({ field: field.name, value: normalizedValue });
  },

  buildRequestOptions: function() {
    var url = (typeof(this.props.url) === 'function') ? this.props.url() : this.props.url;
    var method = this.props.method || 'post';
    var type = this.props.type || 'json';

    var contentType;
    if (type === 'json') {
      contentType = 'application/json';
    }

    var data = {};
    if (this.props.data) {
      if (typeof(this.props.data) === 'function') {
        data = this.props.data();
      } else {
        data = this.props.data;
      }
    } else {
      this.props.fields.forEach(function(field) {
        data[field.name] = this.state[field.name];
      }.bind(this));
      if (type === 'json') {
        data = JSON.stringify(data);
      }
    }

    return {
      url: url,
      method: method,
      type: type,
      contentType: contentType,
      data: data
    };
  },

  getErrorMessage: function(err) {
    var errorMessage;
    if (this.props.submitErrorMessage) {
      errorMessage = this.props.submitErrorMessage;
      if (typeof(errorMessage) === 'function') {
        errorMessage = errorMessage(err);
      }
    }

    if (!errorMessage) {
      if (err && err.response) {
        errorMessage = err.response;
        if (errorMessage) {
          if (typeof(errorMessage) === 'string') {
            try {
              errorMessage = JSON.parse(errorMessage);
            } catch (e) {
              // swallow
            }
          }

          if (errorMessage.message) {
            errorMessage = errorMessage.message;
          }
        }
      }
    }

    errorMessage = errorMessage
    || tr("We were unable to process your request. You may want to try again later.");
    return errorMessage;
  },

  handleSubmit: function(e) {
    e.preventDefault();

    this.setState({ isSubmitting: true, hadSubmitError: false });

    Promise
      .bind(this)
      .return(reqwest(this.buildRequestOptions()))
      .then(function(res) {
        this.props.onAfterSubmit(res);
      })
      .catch(function(err) {
        this.setState({ hadSubmitError: true, formErrorMessage: this.getErrorMessage(err) });
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
        defaultValue: field.defaultValue,
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
        ? React.DOM.div({ className: 'error' }, this.state.formErrorMessage)
        : null,
      React.DOM.input(submitProps));
  }
});

'use strict';

var React = require('react');
var prefs = require('../repositories/preferences');

module.exports = React.createClass({
  displayName: 'App',

  getInitialState: function() {
    return {
      language: prefs.language
    };
  },

  handleLanguageChange: function(e) {
    prefs.language = e.target.value;
    this.setState({ language: prefs.language });
  },

  render: function() {
    var tr = require('../localization').getTranslator();

    return React.DOM.div(null,
      React.DOM.nav(null,
        React.DOM.menu(null,
          React.DOM.label({ htmlFor: 'language' }, tr('Language')),
          React.DOM.select(
            { id: 'language', value: this.state.language, onChange: this.handleLanguageChange },
            React.DOM.option({ value: 'en' }, tr('English')),
            React.DOM.option({ value: 'es' }, tr('Spanish'))))),
      this.props.activeRouteHandler());
  }
});

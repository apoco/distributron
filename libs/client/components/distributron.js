"use strict";

var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var Routes = Router.Routes;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var LoginForm = require('./login-form');
var RegistrationForm = require('./registration-form');

var Distributron = React.createClass({
  displayName: 'Distributron',
  render: function() {
    return Routes({ location: 'history' },
      Route({ name: 'login', path: '/login', handler: LoginForm }),
      Route({ name: 'register', path: '/register', handler: RegistrationForm }),
      DefaultRoute({ handler: LoginForm }));
  }
});

React.renderComponent(
  Distributron(null),
  document.querySelector('body'));

module.exports = Distributron;

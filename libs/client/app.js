"use strict";

var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var Routes = Router.Routes;
var DefaultRoute = Router.DefaultRoute;
var LoginForm = require('./components/login-form');

React.renderComponent(
  Routes({ location: 'history' },
    Route({ name: 'login', path: '/login', handler: LoginForm }),
    Route({ name: 'register', path: '/register', handler: require('./components/registration-form') }),
    Route({ name: 'activate', path: '/activate/:code', handler: require('./components/activation-page') }),
    DefaultRoute({ handler: LoginForm })),
  document.querySelector('body'));

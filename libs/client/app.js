"use strict";

var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var Routes = Router.Routes;
var DefaultRoute = Router.DefaultRoute;
var LoginForm = require('./components/login-form');
var Dashboard = require('./components/dashboard');

React.renderComponent(
  Routes({ location: 'history' },
    Route({ name: 'login', path: '/login', handler: LoginForm }),
    Route({ name: 'logout', path: '/logout', handler: require('./components/logout-page') }),
    Route({ name: 'register', path: '/register', handler: require('./components/registration-form') }),
    Route({ name: 'activate', path: '/activate/:code', handler: require('./components/activation-page') }),
    Route({
      name: 'reset-password',
      path: '/reset-password/?:username?',
      handler: require('./components/reset-password-form')
    }),

    Route({ name: 'dashboard', path: '/', handler: Dashboard }),

    DefaultRoute({ handler: Dashboard })),
  document.querySelector('body')
);

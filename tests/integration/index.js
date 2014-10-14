"use strict";

var expect = require('chai').expect;

var childProcess = require('child_process');
var path = require('path');
var url = require('url');
var q = require('q');
var request = require('request');
var webdriver = require('selenium-webdriver');
var byCss = webdriver.By.css;

describe('The Distributron', function() {

  var appProcess;
  var driver;
  var baseUrl = 'http://127.0.0.1:2835/';

  before(function(done) {
    var startupScript = path.resolve(__dirname, '../../index.js');
    appProcess = childProcess.fork(startupScript, ['config.json'], {silent: true, cwd: __dirname});
    appProcess.stdout.on('data', function(data) {
      process.stdout.write(data);
      done && done();
      done = null;
    });
    appProcess.stderr.on('data', function(data) {
      process.stderr.write(data);
    });

    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();
  });

  describe('startup script', function() {
    it('starts a web server', function(done) {
      request(baseUrl, function(err, response) {
        expect(err).to.not.exist;
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.match(/^text\/html(;.*)?/);
        done();
      });
    });
  });

  describe('login form', function() {
    it('has a username and password input', function(done) {
      goToUrl('/')
        .then(function() {
          return q.all([
            select('input[type="text"][name="username"]'),
            select('input[type="password"][name="password"]')
          ]);
        })
        .spread(function(username, password) {
          expect(username).to.exist;
          expect(password).to.exist;
          done();
        })
        .fail(done);
    });

    describe('register link', function() {
      it('is displayed', function(done) {
        getRegistrationLink()
          .then(function(link) {
            expect(link).to.exist;
            done();
          })
          .fail(done);
      });

      it('takes you to a registration form', function(done) {
        getRegistrationLink()
          .then(function(link) {
            return link.click();
          })
          .then(function() {
            return q.all([
              select('input[name="username"]'),
              select('input[name="password"]'),
              select('input[name="confirm"]'),
              select('input[type="submit"]')
            ]);
          })
          .spread(function(username, password, confirm, submit) {
            expect(username).to.exist;
            expect(password).to.exist;
            expect(confirm).to.exist;
            expect(submit).to.exist;
            done();
          })
          .fail(done);
      });

      function getRegistrationLink() {
        return goToUrl('/')
          .then(function() {
            return select('a[href="/register"]');
          });
      }
    });
  });

  describe('registration form', function() {
    it('has a link back to the login form', function(done) {
      goToUrl('/register')
        .then(function() {
          return select('a[href="/login"]');
        })
        .then(function(link) {
          expect(link).to.exist;
          done();
        })
        .fail(done);
    });
  });

  after(function() {
    appProcess && appProcess.kill();
    driver.quit();
  });

  function goToUrl(path) {
    return q(driver.get(url.resolve(baseUrl, path)));
  }

  function select(selector) {
    return driver.findElement(byCss(selector));
  }
});

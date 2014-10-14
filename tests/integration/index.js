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
          return select([
            'input[type="text"][name="username"]',
            'input[type="password"][name="password"]'
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
            return select([
              'input[name="username"]',
              'input[name="password"]',
              'input[name="confirm"]',
              'input[type="submit"]'
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

    describe('validation', function() {
      var inputs;

      beforeEach(function(done) {
        goToUrl('/register')
          .then(function() {
            return select([
              '[name="username"]',
              '[name="password"]',
              '[name="confirm"]',
              '[name="question"]',
              '[name="answer"]',
              '[type="submit"]']);
          })
          .spread(function(username, password, confirm, question, answer, submit) {
            inputs = {
              username: username,
              password: password,
              confirm: confirm,
              question: question,
              answer: answer,
              submit: submit };
            return q.all([
              inputs.username.sendKeys('test@test.com'),
              inputs.password.sendKeys('password'),
              inputs.confirm.sendKeys('password'),
              inputs.question.sendKeys('question'),
              inputs.answer.sendKeys('answer')
            ]);
          })
          .then(function() { done(); })
          .fail(done);
      });

      it('ensures that the username is populated', function() {
        inputs.username.clear();

        inputs.submit.click();

        expect(select('form .error')).to.exist;
      });
    });
  });

  after(function() {
    appProcess && appProcess.kill();
    driver.quit();
  });

  function goToUrl(path) {
    return q(driver.get(url.resolve(baseUrl, path)));
  }

  function select(selectors) {
    if (selectors instanceof Array) {
      return q.all(selectors.map(function(selector) {
        return driver.findElement(byCss(selector));
      }));
    } else {
      return driver.findElement(byCss(selectors));
    }
  }
});

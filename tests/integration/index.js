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

  this.timeout(5000);

  before(function(done) {
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();

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
    it('has a username and password input', function() {
      return goToUrl('/')
        .then(function() {
          return q.all([
            waitFor('input[name="username"]', 5000),
            waitFor('input[name="password"]', 5000)
          ]);
        })
        .spread(function(username, password) {
          expect(username).to.exist;
          expect(password).to.exist;
        });
    });

    describe('register link', function() {
      it('is displayed', function() {
        return getRegistrationLink()
          .then(function(link) {
            expect(link).to.exist;
          });
      });

      it('takes you to a registration form', function() {
        return getRegistrationLink()
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
          });
      });

      function getRegistrationLink() {
        return goToUrl('/')
          .then(function() {
            return waitFor('a[href="/register"]');
          });
      }
    });
  });

  describe('registration form', function() {

    beforeEach(function() {
      return goToUrl('/register');
    });

    it('has a link back to the login form', function() {
      expect(select('a[href="/login"]')).to.exist;
    });

    it('does not validate before the form changes', function() {
      return q(driver.findElements(byCss('form .error')))
        .then(function(elements) {
          expect(elements.length).to.equal(0);
        });
    });

    describe('validation', function() {
      var inputs;

      beforeEach(function() {
        return q(select([
            '[name="username"]',
            '[name="password"]',
            '[name="confirm"]',
            '[name="question"]',
            '[name="answer"]',
            '[type="submit"]']
          ))
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
          });
      });

      it('ensures that the username is populated', function() {
        return fillInput(inputs.username, '')
          .then(function() {
            return select('form .error');
          })
          .then(function(error) {
            expect(error).to.exist;
          });
      });

      it('ensures that the username is an email address', function() {
        return fillInput(inputs.username, 'not an email address')
          .then(function() {
            expect(select('form .error')).to.exist;
          });
      });

      it('ensures that the password is populated', function() {
        return fillInput(inputs.password, '')
          .then(function() {
            return select('form .error');
          })
          .then(function(error) {
            expect(error).to.exist;
          });
      });

      it('ensures that the password confirmation matches', function() {
        return fillInput(inputs.password, 'legitPassword')
          .then(function() {
            return fillInput(inputs.confirm, 'invalidMatch');
          })
          .then(function() {
            return select('form .error');
          })
          .then(function(error) {
            expect(error).to.exist;
          });
      });
    });
  });

  after(function() {
    appProcess && appProcess.kill();
    driver.quit();
  });

  function goToUrl(path) {
    var absoluteUrl = url.resolve(baseUrl, path);
    return q(driver.getCurrentUrl())
      .then(function(currentUrl) {
        if (currentUrl === absoluteUrl) {
          return q(driver.navigate().refresh());
        } else {
          return q(driver.get(absoluteUrl));
        }
      });
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

  function waitFor(selector, timeout) {
    selector = byCss(selector);
    return driver
      .wait(function() {
        return driver.findElement(selector).isDisplayed();
      }, timeout || 2000)
      .then(function() {
        return driver.findElement(selector);
      });
  }

  function fillInput(input, text) {
    return q(input.click())
      .then(function() {
        return input.sendKeys(
          webdriver.Key.chord(webdriver.Key.CONTROL, 'a'),
          webdriver.Key.BACK_SPACE,
          text,
          webdriver.Key.TAB);
      });
  }
});

"use strict";

var expect = require('chai').expect;

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');
var url = require('url');
var q = require('q');
var request = require('request');
var webdriver = require('selenium-webdriver');
var smtpTester = require('smtp-tester');
var config = require('./config.json');

var byCss = webdriver.By.css;

describe('The Distributron', function() {

  var appProcess;
  var driver;
  var baseUrl = 'http://127.0.0.1:2835/';

  this.timeout(5000);

  before(function() {
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();

    var dbPath = path.resolve(__dirname, 'test.db');
    var deleteDb = q.defer();
    fs.unlink(dbPath, deleteDb.makeNodeResolver());

    return deleteDb.promise
      .catch(function(err) {
        // ignore
      })
      .then(function() {
        var start = q.defer();
        var startupScript = path.resolve(__dirname, '../../index.js');
        appProcess = childProcess.fork(
          startupScript,
          ['config.json', '--database=sqlite://' + dbPath, '--init=true'],
          {silent: true, cwd: __dirname});
        appProcess.stdout.on('data', function() {
          start.resolve();
        });
        appProcess.stdout.pipe(process.stdout);
        appProcess.stderr.pipe(process.stderr);

        return start.promise;
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
      return goToUrl('/register')
        .then(function() {
          return waitFor('form');
        });
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

    it('disables the submit button when the form is incomplete', function() {
      return q(driver.findElement(byCss('form [type="submit"]')))
        .then(function(element) {
          return element.isEnabled();
        })
        .then(function(isEnabled) {
          expect(isEnabled).to.be.false;
        });
    });

    describe('validation', function() {
      var inputs;

      beforeEach(function() {
        return populateForm(
          {
            username: 'test@test.com',
            password: 'password',
            confirm: 'password',
            question: 'question',
            answer: 'answer'
          })
          .then(function(inputElements) {
            inputs = inputElements;
          });
      });

      it('ensures that the username is populated', function() {
        return fillInput(inputs.username, '').then(expectValidationError);
      });

      it('ensures that the username is an email address', function() {
        return fillInput(inputs.username, 'not an email address').then(expectValidationError);
      });

      it('ensures that the password is populated', function() {
        return fillInput(inputs.password, '').then(expectValidationError);
      });

      it('ensures that the password confirmation matches', function() {
        return fillInput(inputs.password, 'legitPassword')
          .then(function() {
            return fillInput(inputs.confirm, 'invalidMatch');
          })
          .then(expectValidationError);
      });

      it('ensures that the security question is populated', function() {
        return fillInput(inputs.question, '').then(expectValidationError);
      });

      it('ensures that the security answer is populated', function() {
        return fillInput(inputs.answer, '').then(expectValidationError);
      });

      function expectValidationError() {
        return q(inputs.submit.isEnabled())
          .then(function(isSubmitEnabled) {
            expect(select('form .error')).to.exist;
            expect(isSubmitEnabled).to.be.false;
          });
      }
    });

    it('prevents multiple clicks on the submit button');

    it('sends an activation email after submitting', function() {

      var mailServer = startSMTPServer();
      var username = 'test' + Math.floor(Math.random() * 1000000) + "@test.io";
      return populateForm(
        {
          username: username,
          password: 'password',
          confirm: 'password',
          question: 'What is love?',
          answer: "baby don't hurt me"
        })
        .then(function(inputs) {
          return inputs.submit.click();
        })
        .then(function() {
          return receiveAndParseEmail(mailServer);
        })
        .then(function(email) {
          var activationLinks = email.links.filter(function(i, link) {
            return /\/api\/registrations\/.*?\/activate/.test(link.attribs.href);
          });

          expect(email.sender).to.equal(config.email.fromAddress);
          expect(email.receivers).to.have.property(username);
          expect(activationLinks.length).to.be.ok;
        })
        .finally(function() {
          mailServer.stop();
        });
    });

    it('shows a success message on a successful submit');
    it('rejects registration for an account that already exists');
    it('re-sends an activation email if registration has already been submitted');

    function populateForm(fieldValues) {
      var inputs;

      return q(
        select([
          '[name="username"]',
          '[name="password"]',
          '[name="confirm"]',
          '[name="question"]',
          '[name="answer"]',
          '[type="submit"]'
        ]))
        .spread(function(username, password, confirm, question, answer, submit) {
          inputs = {
            username: username,
            password: password,
            confirm: confirm,
            question: question,
            answer: answer,
            submit: submit
          };
          return q.all(Object.keys(fieldValues).map(function(inputName) {
            return inputs[inputName].sendKeys(fieldValues[inputName]);
          }));
        })
        .then(function() {
          return inputs;
        });
    }
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

  function startSMTPServer() {
    var smtpPort = config.email.transport.port || 25;
    return smtpTester.init(smtpPort);
  }

  function receiveAndParseEmail(mailServer) {
    var waitForEmail = q.defer();
    mailServer.bind(function(address, id, email) {
      waitForEmail.resolve(email);
    });

    return waitForEmail.promise
      .then(function(email) {
        var cheerio = require('cheerio');
        email.links = cheerio('a', email.html);
        return email;
      })
  }
});

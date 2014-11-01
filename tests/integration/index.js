"use strict";

var expect = require('chai').expect;

var Promise = require('bluebird');
var childProcess = require('child_process');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var url = require('url');
var request = require('request');
var webdriver = require('selenium-webdriver');
var smtpTester = require('smtp-tester');
var cheerio = require('cheerio');
var config = require('./config.json');
var byCss = webdriver.By.css;

describe('The Distributron', function() {

  var appProcess;
  var driver;
  var baseUrl = 'http://127.0.0.1:2835/';
  var dbFile = path.resolve(__dirname, 'test.db');
  var mailServer;

  this.timeout(30000);

  before(function() {
    driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();

    return deleteDatabase()
      .then(function() {
        return new Promise(function(resolve, reject) {
          var startupScript = path.resolve(__dirname, '../../index.js');
          appProcess = childProcess.fork(
            startupScript,
            ['config.json', '--database=sqlite://' + dbFile],
            {silent: true, cwd: __dirname});
          appProcess.on('error', function(err) {
            console.error(err.stack);
            reject(err);
          });
          appProcess.stdout.on('data', function() {
            resolve(null);
          });
          appProcess.stdout.pipe(process.stdout);
          appProcess.stderr.pipe(process.stderr);
        });
      });
  });

  beforeEach(function() {
    mailServer = startSMTPServer();
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
    beforeEach(function() {
      return goToUrl('/login')
        .then(function() {
          return waitForElement('form');
        });
    });

    it('has a username and password input', function() {
      return Promise
        .all([
          waitForElement('input[name="username"]', 5000),
          waitForElement('input[name="password"]', 5000)
        ])
        .spread(function(username, password) {
          expect(username).to.exist;
          expect(password).to.exist;
        });
    });

    it('validates that a username is entered', function() {
      return populateForm({ password: 'some password' })
        .then(function() {
          return select('input[type="submit"]');
        })
        .then(function(submit) {
          return submit.isEnabled();
        })
        .then(function(isEnabled) {
          expect(isEnabled).to.be.false;
        })
    });

    it('validates that a password is entered', function() {
      return populateForm({ username: 'some username' })
        .then(function() {
          return select('input[type="submit"]');
        })
        .then(function(submit) {
          return submit.isEnabled();
        })
        .then(function(isEnabled) {
          expect(isEnabled).to.be.false;
        })
    });

    it('shows an error if the username is invalid', function() {
      return submitForm({ username: 'some@unknown.email', password: 'password' })
        .then(expectError);
    });

    it('shows an error if the password is invalid', function() {
      return registerNewUser()
        .bind({})
        .then(function(result) {
          return submitForm('/login', {
            username: result.inputValues.username,
            password: 'invalid password'
          });
        })
        .then(expectError);
    });

    it('locks the account if too many failed logins are attempted', function() {
      return registerNewUser()
        .bind({})
        .then(function(result) {
          this.user = result.inputValues;
        })
        .repeat(3, function() {
          return submitInvalidLogin(this.user.username);
        })
        .then(function() {
          return submitForm('/login', { username: this.user.username, password: this.user.password });
        })
        .then(expectError);
    });

    it('resets the lockout count on a successful login', function() {
      return registerNewUser()
        .bind({})
        .then(function(result) {
          this.user = result.inputValues;
        })
        .repeat(2, function() {
          return submitInvalidLogin(this.user.username);
        })
        .then(function() {
          return submitForm('/login', { username: this.user.username, password: this.user.password });
        })
        .repeat(2, function() {
          return submitInvalidLogin(this.user.username);
        })
        .then(function() {
          return submitForm('/login', { username: this.user.username, password: this.user.password });
        })
        .then(function() {
          return waitUntilElementIsGone('form');
        });
    });

    it('resets the lockout status of an account after a period of time', function() {
      return registerNewUser()
        .bind({})
        .then(function(result) {
          this.user = result.inputValues;
        })
        .repeat(3, function() {
          return submitInvalidLogin(this.user.username);
        })
        .delay(5000)
        .then(function() {
          return submitForm('/login', { username: this.user.username, password: this.user.password });
        })
        .then(function() {
          return waitUntilElementIsGone('form');
        });
    });

    it('redirects to the dashboard if the username and password are valid');

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
        return waitForElement('a[href="/register"]');
      }
    });

    it('shows a password reset link', function() {
      return select('a[href="/reset-password/"]')
        .then(function(link) {
          expect(link).to.exist;
        });
    });

    function submitInvalidLogin(username) {
      return submitForm('/login', { username: username, password: 'invalid' })
        .then(function() {
          return waitForElement('form .error');
        });
    }

    function expectError() {
      return waitForElement('form .error')
        .then(function (elem) {
          expect(elem).to.exist;
        });
    }
  });

  describe('logout action', function() {
    it('takes the user to the login form');
    it('clears the authorization cookie');
  });

  describe('registration form', function() {

    beforeEach(function() {
      return goToRegistrationForm();
    });

    it('has a link back to the login form', function() {
      expect(select('a[href="/login"]')).to.exist;
    });

    it('does not validate before the form changes', function() {
      return ensureElementDoesNotExist('form .error');
    });

    it('disables the submit button when the form is incomplete', function() {
      return driver.findElement(byCss('form [type="submit"]'))
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
        return populateRegistrationForm()
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

      it('ensures that the username is not already in use', function() {
        var username;
        return registerNewUser()
          .then(function(result) {
            username = result.inputValues.username;
            return populateRegistrationForm(getRandomRegistrationData(username));
          })
          .then(function(newInputs) {
            inputs = newInputs;
            return waitForElement('form .error');
          })
          .then(function() {
            return expectValidationError();
          });
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
        return inputs.submit.isEnabled()
          .then(function(isSubmitEnabled) {
            expect(select('form .error')).to.exist;
            expect(isSubmitEnabled).to.be.false;
          });
      }
    });

    it('prevents multiple clicks on the submit button', function() {
      var inputs;
      return populateRegistrationForm()
        .then(function(formInputs) {
          inputs = formInputs;
          return inputs.submit.click();
        })
        .then(function() {
          return inputs.submit.isEnabled();
        })
        .then(function(isEnabled) {
          expect(isEnabled).to.be.false;
        });
    });

    it('sends an activation email after submitting', function() {
      return submitRegistrationForm()
        .then(function(formValues) {
          return receiveAndParseActivationEmail(formValues.username);
        })
        .then(function(email) {
          expect(email.sender).to.equal(config.email.fromAddress);
          expect(email.activationLinks.length).to.be.ok;
        });
    });

    it('shows a success message on a successful submit', function() {
      return submitRegistrationForm()
        .then(function(inputValues) {
          return receiveAndParseActivationEmail(inputValues.username);
        })
        .then(function() {
          return ensureElementDoesNotExist('form');
        });
    });

    it('localizes the success message');

    it('regenerates activation codes to replace unactivated codes', function() {
      var firstUserResults;
      return getNewUserActivation()
        .then(function(results) {
          firstUserResults = results;
          return goToRegistrationForm();
        })
        .then(function() {
          return submitRegistrationForm(firstUserResults.inputValues);
        })
        .then(function() {
          return goToUrl(firstUserResults.activationUrl);
        })
        .then(function() {
          return waitForElement('.error-message');
        })
        .then(function(elem) {
          expect(elem).to.exist;
        });
    });
  });

  describe('activation page', function() {
    it('shows a login form when a valid activation code is given', function() {
      return activateNewUser()
        .then(function() {
          return waitForElement('form', 10000);
        })
        .then(function(form) {
          expect(form).to.exist;
        });
    });

    it('shows a login form when an already-activated code is given', function() {
      var activationUrl;
      return activateNewUser()
        .then(function(url) {
          activationUrl = url;
          return waitForElement('form', 10000);
        })
        .then(function() {
          return goToUrl(activationUrl);
        })
        .then(function() {
          return waitForElement('form', 10000);
        })
        .then(function(form) {
          expect(form).to.exist;
        });
    });

    it('shows a failure message for an invalid code', function() {
      return goToUrl('/activate/some-invalid-code')
        .then(function() {
          return waitForElement('.error-message');
        })
        .then(function(element) {
          expect(element).to.exist;
        });
    });

    function activateNewUser() {
      var activationUrl;
      return goToRegistrationForm()
        .then(function() {
          return submitRegistrationForm();
        })
        .then(function(inputValues) {
          return receiveAndParseActivationEmail(inputValues.username);
        })
        .then(function(email) {
          activationUrl = email.activationLinks[0].attribs.href;
          return goToUrl(activationUrl);
        })
        .then(function() {
          return activationUrl;
        });
    }
  });

  describe('password reset form', function() {
    beforeEach(function() {
      return goToPasswordResetForm();
    });

    it('exists', function() {
      return select('form')
        .then(function(form) {
          expect(form).to.exist;
        });
    });

    it('has links to the login and registration forms');

    it('validates that the username is populated', function() {
      return select('input[type="submit"]')
        .then(function(submit) {
          return submit.isEnabled();
        })
        .then(function(isEnabled) {
          expect(isEnabled).to.be.false;
        });
    });

    it('validates that the username exists', function() {
      return populateForm({ username: 'some.unknown@email.com'})
        .then(function() {
          return select(['input[type="submit"]', 'form .error']);
        })
        .spread(function(submit, error) {
          expect(error).to.exist;
          return submit.isEnabled();
        })
        .then(function(canSubmit) {
          expect(canSubmit).to.be.false;
        });
    });

    it('prompts for the security answer after submitting the username', function() {
      var registrationData;
      return registerNewUser()
        .then(function(result) {
          registrationData = result.inputValues;
          return submitPasswordResetUserName(registrationData.username);
        })
        .call('getAttribute', 'id')
        .then(function(id) {
          return select('label[for="' + id + '"]');
        })
        .call('getText')
        .then(function(text) {
          expect(text).to.equal(registrationData.question);
        });
    });

    it('has a reset button to return to the username entry');

    it('validates that the security answer is correct', function() {
      var user;
      return registerNewUser()
        .then(function(result) {
          user = result.inputValues;
          return submitPasswordResetUserName(user.username);
        })
        .then(function() {
          return submitForm({ answer: 'wrong answer'});
        })
        .then(function() {
          return waitForElement('form .error');
        })
        .then(function(error) {
          expect(error).to.exist;
        });
    });

    it('sends a password reset email if the security answer is correct', function() {
      var user;
      return registerNewUser()
        .then(function(result) {
          user = result.inputValues;

          return submitPasswordReset(user);
        })
        .then(function(resetLink) {
          expect(resetLink).to.exist;
        });
    });

    it('accepts security answers in a case-insensitive manner');

    it('shows a login failure if the email reset link contains an old password');

    it('prompts for a password change when following the email reset link', function() {
      return resetPasswordAndFollowLink()
        .then(function() {
          return select(['input[name="old"]', 'input[name="password"]', 'input[name="confirm"]'])
        })
        .spread(function(old, password, confirm) {
          expect(old).to.exist;
          expect(password).to.exist;
          expect(confirm).to.exist;
          return old.getAttribute('value');
        })
        .then(function(oldPassword) {
          expect(oldPassword).to.exist;
        });
    });

    it('validates that the new password is entered');

    it('validates that the password confirmation matches');

    it('changes the password to the entered value when completing a password reset', function() {
      var user;
      return resetPasswordAndFollowLink()
        .then(function(theUser) {
          user = theUser;
          return submitForm({ password: 'n00Passw*rd', confirm: 'n00Passw*rd' });
        })
        .then(function() {
          return waitUntilElementIsGone('form');
        })
        .then(function() {
          return goToUrl('/login');
        })
        .then(function() {
          return submitForm({ username: user.username, password: 'n00Passw*rd' });
        })
        .then(function() {
          return waitUntilElementIsGone('form');
        });
    });

    it('shows a link to the dashboard in the password change message');

    function goToPasswordResetForm() {
      return goToUrl('/reset-password');
    }

    function submitPasswordResetUserName(username) {
      return goToPasswordResetForm()
        .then(function() {
          return submitForm({ username: username });
        })
        .then(function() {
          return waitForElement('input[name="answer"]');
        });
    }

    function submitPasswordReset(user) {

      mailServer.stop();
      mailServer = startSMTPServer();

      return submitPasswordResetUserName(user.username)
        .then(function() {
          return submitForm({ answer: user.answer });
        })
        .then(function() {
          return waitUntilElementIsGone('form');
        })
        .then(function() {
          return receiveEmail(user.username);
        })
        .then(function(email) {
          var resetLinks = cheerio('a', email.html).filter(function(i, link) {
            return /^\/reset-password/.test(link.attribs.href);
          });
          return resetLinks[0];
        });
    }

    function resetPasswordAndFollowLink() {
      var user;
      return registerNewUser()
        .then(function(result) {
          user = result.inputValues;
          return submitPasswordReset(user);
        })
        .then(function(resetLink) {
          return goToUrl(resetLink.attribs.href);
        })
        .then(function() {
          return waitForElement('form');
        })
        .then(function() {
          return user;
        });
    }
  });

  describe('dashboard', function() {
    it('exists');
  });

  afterEach(function() {
    mailServer.stop();
  });

  after(function() {
    appProcess && appProcess.kill();
    driver.quit();
    return deleteDatabase();
  });

  function goToUrl(path) {
    var absoluteUrl = url.resolve(baseUrl, path);
    return Promise.resolve(driver.getCurrentUrl())
      .then(function(currentUrl) {
        if (currentUrl === absoluteUrl) {
          return driver.navigate().refresh();
        } else {
          return driver.get(absoluteUrl);
        }
      });
  }

  function select(selectors) {
    if (selectors instanceof Array) {
      return Promise.map(selectors, select).all();
    } else {
      return Promise.resolve(driver.findElement(byCss(selectors)));
    }
  }

  function waitFor(fn, timeout) {
    return Promise.resolve(driver.wait(fn, timeout || 2000));
  }

  function waitForElement(selector, timeout) {
    return waitFor(
      function() {
        return driver.findElements(byCss(selector))
          .then(function(elems) {
            return !!(elems && elems.length);
          });
      }, timeout)
      .then(function() {
        return select(selector);
      });
  }

  function waitUntilElementIsGone(selector, timeout) {
    return waitFor(
      function() {
        return driver.findElements(byCss(selector))
          .then(function(elems) {
            return !elems || !elems.length;
          });
      }, timeout);
  }

  function ensureElementDoesNotExist(selector) {
    return driver.findElements(byCss(selector))
      .then(function(elements) {
        expect(elements.length).to.equal(0);
      });
  }

  function fillInput(input, text) {
    if (typeof(input) === 'string') {
      return select(input).then(function(input) { return fillInput(input, text); });
    }

    return Promise
      .resolve(click(input))
      .call(
        'sendKeys',
        webdriver.Key.chord(webdriver.Key.CONTROL, 'a'),
        webdriver.Key.BACK_SPACE,
        text,
        webdriver.Key.TAB);
  }

  function click(element) {
    if (typeof(element) === 'string') {
      return select(element).then(click);
    }

    return element.click()
      .then(function() {
        return element;
      });
  }

  function waitUntilEnabled(element, timeout) {
    return waitFor(function() { return element.isEnabled(); }, timeout || 2000);
  }

  function populateForm(url, fieldValues) {
    if (typeof(url) === 'string') {
      return goToUrl(url).then(function() { return populateForm(fieldValues); });
    }

    fieldValues = url;
    return Object
      .keys(fieldValues)
      .reduce(function(prev, fieldName) {
        return prev.then(function() {
          return fillInput('input[name="' + fieldName + '"]', fieldValues[fieldName]);
        });
      }, Promise.resolve())
  }

  function submitForm(url, fieldValues) {
    return populateForm(url, fieldValues)
      .then(function() {
        return click('input[type="submit"]');
      });
  }

  function goToRegistrationForm() {
    return goToUrl('/register')
      .then(function() {
        return waitForElement('#registration-form');
      });
  }

  function populateRegistrationForm(fieldValues) {
    fieldValues = fieldValues || getRandomRegistrationData();
    var inputs;
    return goToRegistrationForm()
      .then(function() {
        return select([
          'form',
          '[name="username"]',
          '[name="password"]',
          '[name="confirm"]',
          '[name="question"]',
          '[name="answer"]',
          '[type="submit"]'
        ]);
      })
      .spread(function(form, username, password, confirm, question, answer, submit) {
        inputs = {
          form: form,
          username: username,
          password: password,
          confirm: confirm,
          question: question,
          answer: answer,
          submit: submit
        };
        return Object.keys(fieldValues);
      })
      .map(function(inputName) {
        return fillInput(inputs[inputName], fieldValues[inputName]);
      })
      .all()
      .then(function() {
        return inputs;
      });
  }

  function submitRegistrationForm(fieldValues) {
    fieldValues = fieldValues || getRandomRegistrationData();
    var inputs;
    return populateRegistrationForm(fieldValues)
      .then(function(formInputs) {
        inputs = formInputs;
        return waitUntilEnabled(inputs.submit);
      })
      .then(function() {
        return inputs.submit.click();
      })
      .then(function() {
        return fieldValues;
      });
  }

  function getNewUserActivation() {
    var result = {
      inputValues: getRandomRegistrationData()
    };
    return submitRegistrationForm(result.inputValues)
      .then(function() {
        return receiveAndParseActivationEmail(result.inputValues.username);
      })
      .then(function(email) {
        result.activationUrl = email.activationLinks[0].attribs.href;
        return result;
      })
  }

  function registerNewUser() {
    var result;
    return getNewUserActivation()
      .then(function(activationData) {
        result = activationData;
        return goToUrl(result.activationUrl);
      })
      .then(function() {
        return waitForElement('form');
      })
      .then(function() {
        return result;
      });
  }

  var uniqueId = 1;
  function getRandomRegistrationData(username) {
    username = username || 'test' + (uniqueId++) + "@test.io";
    return {
      username: username,
      password: 'password',
      confirm: 'password',
      question: 'What is love?',
      answer: "baby don't hurt me"
    };
  }

  function startSMTPServer() {
    var smtpPort = config.email.transport.port || 25;
    return smtpTester.init(smtpPort);
  }

  function receiveEmail(username) {
    return new Promise(function(resolve) {
      mailServer.bind(function(address, id, email) {
        if (username in email.receivers) {
          resolve(email);
        }
      });
    });
  }

  function receiveAndParseActivationEmail(username) {
    return receiveEmail(username)
      .then(function(email) {
        email.activationLinks = cheerio('a', email.html).filter(function(i, link) {
          return /\/activate\//.test(link.attribs.href);
        });
        return email;
      });
  }

  function deleteDatabase() {
    return fs.unlinkAsync(dbFile)
      .catch(function(err) {
        // ignore
      });
  }
});

Promise.prototype.repeat = function(times, fn) {
  var result = this;
  for (var i = 0; i < times; i++) {
    result = result.then(fn);
  }
  return result;
};

"use strict";

module.exports = {
  create: create
};

var Promise = require('bluebird');
var cryptoUtils = require('../utils/crypto');
var config = require('../config').settings;

function create(db) {
  return db.define('users', {
    id: { type: 'text', size: 36, required: true, key: true },
    username: { type: 'text', size: 1000, required: true },
    status: { type: 'text', size: 20, required: true },
    passwordSalt: { type: 'binary', size: 32, required: true },
    passwordHash: { type: 'binary', size: 32, required: true },
    securityQuestion: { type: 'text', size: 1000, required: true },
    securityAnswerSalt: { type: 'binary', size: 32, required: true },
    securityAnswerHash: { type: 'binary', size: 32, required: true },
    activationCode: { type: 'text', size: 36 },
    lockoutCounter: { type: 'integer', size: 2, defaultValue: 0 },
    createdTimestamp: { type: 'date', time: true, required: true },
    activatedTimestamp: { type: 'date', time: true },
    lockoutTimestamp: { type: 'date', time: true }
  }, {
    methods: {
      validatePassword: function(password) {
        return cryptoUtils
          .validateHashedValue(this.passwordSalt, password, this.passwordHash)
          .bind(this)
          .then(function(isValid) {
            if (isValid) {
              if (this.lockoutTimestamp || this.lockoutCounter) {
                this.clearLockout();
                return this.saveAsync().return(true);
              } else {
                return true;
              }
            } else {
              this.lockoutCounter++;
              if (this.lockoutCounter >= config.lockoutLoginAttempts) {
                this.lockoutTimestamp = new Date(Date.now());
              }
              return this.saveAsync().return(false);
            }
          });
      },
      isLockedOut: function() {
        var wasLockedOut = this.lockoutTimestamp;
        var hasLockoutExpired =
            wasLockedOut
            && ((Date.now() - this.lockoutTimestamp.getTime()) < config.lockoutDurationInSeconds * 1000);

        if (wasLockedOut) {
          if (hasLockoutExpired) {
            this.clearLockout();
            return false;
          } else {
            return true;
          }
        } else {
          return false;
        }
      },
      clearLockout: function() {
        this.lockoutCounter = 0;
        this.lockoutTimestamp = null;
      },
      setPassword: function(password) {
        return cryptoUtils.getSaltedHash(this.passwordSalt, password)
          .bind(this)
          .then(function(hash) {
            this.passwordHash = hash;
            return this.saveAsync();
          });
      },
      saveAsync: function() {
        return Promise.promisify(this.save, this).call(this);
      }
    }
  });
}

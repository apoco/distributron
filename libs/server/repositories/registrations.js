"use strict";

module.exports = {
  create: create
};

function create(db) {
  return db.define('registrations', {
    username: { type: 'text', size: 1000, required: true, key: true },
    passwordSalt: { type: 'binary', size: 32, required: true },
    passwordHash: { type: 'binary', size: 32, required: true },
    securityQuestion: { type: 'text', size: 1000, required: true },
    securityAnswerSalt: { type: 'binary', size: 32, required: true },
    securityAnswerHash: { type: 'binary', size: 32, required: true },
    activationCode: { type: 'text', size: 64, required: true },
    createdTimestamp: { type: 'date', time: true, required: true },
    activatedTimestamp: { type: 'date', time: true }
  }, {

  });
}

"use strict";

module.exports = {
  create: create
};

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
    createdTimestamp: { type: 'date', time: true, required: true },
    activatedTimestamp: { type: 'date', time: true }
  }, {

  });
}
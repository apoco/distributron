'use strict';

module.exports = {
  create: create
};

function create(db) {
  return db.define('authTokens', {
    id: { type: 'text', size: 36, required: true, key: true },
    userId: { type: 'text', size: 36, required: true },
    createdTimestamp: { type: 'text', required: true },
    expirationTimestamp: { type: 'text', required: true }
  }, {

  });
}

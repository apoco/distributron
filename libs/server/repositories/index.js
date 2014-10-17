"use strict";

var requireDir = require('require-directory');

module.exports = {
  initialize: initialize
};

function initialize(db) {
  module.exports.repositories = requireDir(module, {
    visit: function(repo) {
      return repo.create(db);
    }
  });
}

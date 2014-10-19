'use strict';

module.exports = localizationMiddleware;

function localizationMiddleware(req, res, next) {
  require('continuation-local-storage')
    .getNamespace('session')
    .set('locale', req.headers['accept-language']);
  next();
}

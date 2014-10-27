'use strict';

module.exports = handleError;

function handleError(err, req, res, next) {
  var status = err.status || 500;
  res.status(status).json({ message: err.message, stack: err.stack });
  if (status >= 500) {
    console.error(err.stack || err);
  }
}

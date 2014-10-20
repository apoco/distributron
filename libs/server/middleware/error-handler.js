'use strict';

module.exports = handleError;

function handleError(err, req, res, next) {
  console.error(err.stack);
  res.json(err.status || 500, { message: err.message, stack: err.stack });
}

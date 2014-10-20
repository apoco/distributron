'use strict';

module.exports = handleError;

function handleError(err, req, res, next) {
  console.error(err.stack || err);
  res
    .status(err.status || 500)
    .json({ message: err.message, stack: err.stack });
}

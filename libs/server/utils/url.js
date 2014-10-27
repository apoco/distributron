'use strict';

module.exports = {
  format: formatUrl
};

function formatUrl(formatStr, params) {
  return Object
    .keys(params)
    .reduce(function(current, param) {
      return current.replace('{' + param + '}', encodeURIComponent(params[param]));
    }, formatStr);
}

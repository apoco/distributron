"use strict";

var path = require('path');
var express = require('express');

module.exports = express.static(path.resolve(__dirname, '../../client/static'));

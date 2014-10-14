var path = require('path');
var express = require('express');
var args = require('yargs').argv;
var configPath = args._[0];
var config = configPath
  ? require(path.relative(__dirname, path.resolve(process.cwd(), configPath)))
  : {};

var app = express();

app.use('/assets', require('./middleware/static-files'));
app.use(require('./middleware/ui'));

var port = args.port || config.port || 8000;
app.listen(port);

// Important: integration tests are waiting for something from stdout before continuing on with setup;
// must leave this here.
console.log('Listening at http://localhost:' + port);

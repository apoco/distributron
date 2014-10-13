var path = require('path');
var express = require('express');
var args = require('yargs').argv;
var config = require(path.resolve(process.cwd(), args._[0]));
var app = express();

app.get('/', function(req, res){
  res.send('TODO: Write the actual app');
});

var port = args.port || config.port || 8000;

app.listen(port);

console.log('Listening at http://localhost:' + port);

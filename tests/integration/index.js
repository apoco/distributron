"use strict";

var childProcess = require('child_process');
var expect = require('chai').expect;
var path = require('path');
var request = require('request');

describe('Distributron', function() {
  describe('has a startup script, which', function() {

    var appProcess;

    before(function(done) {
      var startupScript = path.resolve(__dirname, '../../distributron.js');
      appProcess = childProcess.fork(startupScript, ['config.json'], {silent: true});
      appProcess.stdout.on('data', function(data) {
        process.stdout.write(data);
        done && done();
        done = null;
      });
      appProcess.stderr.on('data', function(data) {
        process.stderr.write(data);
      });
    });

    it('starts a web server', function(done) {
      request('http://127.0.0.1:2835/', function(err, response) {
        expect(err).to.not.exist;
        expect(response.statusCode).to.equal(200);
        expect(response.headers['content-type']).to.match(/^text\/html(;.*)?/);
        done();
      });
    });

    after(function() {
      appProcess && appProcess.kill();
    });
  });
});

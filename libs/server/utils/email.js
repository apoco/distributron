'use strict';

module.exports = {
  send: send
};

var Promise = require('bluebird');
var mailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('../config').settings;
var templates = require('../templates');

function send(address, subject, templateName, templateData) {
  var transporter = Promise.promisifyAll(mailer.createTransport(smtpTransport(config.email.transport)));
  return templates.get(templateName)
    .then(function(template) {
      var mailOptions = {
        from: config.email.fromAddress,
        to: address,
        subject: subject,
        html: template(templateData)
      };
      return transporter.sendMailAsync(mailOptions);
    });
}

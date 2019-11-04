'use strict';
if (require('os').platform().indexOf('win32') < 0) {
    throw new Error('win-service is only supported on Windows.')
}

module.exports.Service = require('./lib/service');
module.exports.EventLogger = require('./lib/eventlog');
module.exports.Process = require('./lib/process');
module.exports.process = require('./lib/process');
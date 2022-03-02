'use strict';
if (require('os').platform().indexOf('win32') < 0) {
    throw new Error('winsw is only supported on Windows.')
}

module.exports = {
    process: require('./lib/process'),
    Service: require('./lib/service'),
    EventLogger: require('./lib/eventlog'),
}
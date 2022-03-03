const path = require('path');
const { Service } = require('../index');
const setEvents = require('./service.events');

console.log('__dirname', __dirname)

// carefull with relative paths (node ./examples/service.js => path will not be right)
// for this to work the cmd path needs to be where the file is or use cwd
var srv1 = new Service({ name: '@test1', script: './server.js' });
var srv2 = new Service({ name: '@test2', script: path.resolve('./server.js') });

setEvents([srv1, srv2]);
srv1.install();
srv2.install();
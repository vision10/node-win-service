const path = require('path');
const { Service } = require('../index');

// careful with relative paths (node ./examples/service.js => path will not be right)
// for this to work the cmd path needs to be where the file is or use cwd
var srv1 = new Service({ name: '@test1', script: './server.js' });
var srv2 = new Service({ name: '@test2', script: path.resolve('./server.js') });
setEvents([srv1, srv2]);
srv1.install();
srv2.install();

var srv3 = new Service({ name: '@test3', script: 'server.js', cwd: __dirname });
var srv4 = new Service({ name: '@test4', script: __dirname + '\\' + 'server.js' });
var srv5 = new Service({
    id: 'test',
    name: '@test5',
    script: `${__dirname}\\server.js`,
    cwd: __dirname,
    winswPath: path.join(__dirname, '..'),
    scriptOptions: ['--port=9000']
});

setEvents([srv3, srv4, srv5]);
// srv4.install().catch(errorHandler);
// srv5.install().catch(errorHandler);
// srv3.install().catch(errorHandler);

function errorHandler(error) {
    console.error('caught error', error.message)
}

function setEvents(srv) {
    srv.forEach(service => {
        service.on('stop', function () { console.log(service.name + ' event callback stop !') });
        service.on('uninstall', function (msg) {
            console.log(service.name + ' event callback uninstall !')
            if (msg) console.log('msg', msg)
        });
        service.on('install', async function (msg) {
            console.log(service.name + ' event callback install !')
            if (msg) console.log('msg', msg)
            service.start()
        });
        service.on('start', function () {
            console.log(service.name + ' event callback start !')
            setTimeout(() => { service.uninstall() }, 5000)
            service.uninstall(true);
        });
    })
}
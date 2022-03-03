const path = require('path');
const { Service } = require('../index');

console.log('__dirname', __dirname)

// careful with relative paths (node ./examples/service.js => path will not be right)
// for this to work the cmd path needs to be where the file is or use cwd
var srv1 = new Service({ name: '@test1', script: './server.js' });
var srv2 = new Service({ name: '@test2', script: path.resolve('./server.js') });
setEvents([srv1, srv2]);
// srv1.install();
// srv2.install();

var srv3 = new Service({ id: '@test3', script: 'server.js', cwd: path.join(__dirname, '..') });
var srv4 = new Service({ id: '@test4', script: path.join(__dirname, 'server.js') });
var srv5 = new Service({
    id: 'test5', // service name
    name: '@test5', // display name
    script: `${__dirname}\\server.js`,
    cwd: __dirname,
    winswDest: path.join(__dirname, '..'),
    description: 'some kind of description',
    scriptOptions: ['--port=9000']
});

setEvents([srv3, srv4, srv5]);
srv3.install().catch(errorHandler);
srv4.install().catch(errorHandler);
srv5.install().catch(errorHandler);

function errorHandler(error) {
    console.error('caught error', error.message)
}

function setEvents(srv) {
    srv.forEach(service => {
        const name = service.name || service.id;
        service.on('stop', function (msg) {
            console.log(name + ' event callback stop !')
            if (msg) console.log('msg stop', msg)
        });
        service.on('uninstall', function (msg) {
            console.log(name + ' event callback uninstall !')
            if (msg) console.log('msg uninstall', msg)
        });
        service.on('install', async function (msg) {
            console.log(name + ' event callback install !')
            if (msg) console.log('msg install', msg)

            console.log('start service')
            service.start()
        });
        service.on('start', function (msg) {
            console.log(name + ' event callback start !')
            if (msg) console.log('msg start', msg)
            setTimeout(() => { service.uninstall(null, null, null, true); }, 5000);
        });
    })
}
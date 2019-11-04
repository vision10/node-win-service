const path = require('path');
const { Service } = require('../index');

// careful with relative paths (node ./examples/service.js => path will not be right)
// var srv1 = new Service({ name: 'test1', script: './server.js' });
// var srv2 = new Service({ name: 'test2', script: path.resolve('./server.js') });
// var srv3 = new Service({ name: 'test3', script: 'server.js', cwd: __dirname });
// // for this to work the cmd path needs to be where the server.js file is

// attachEvents([srv1, srv2, srv3]);
// srv1.install(function (err) { console.log(srv1.name + ' callback started !', err) });
// srv2.install(function (err) { console.log(srv2.name + ' callback started !', err) });
// srv3.install(function (err) { console.log(srv3.name + ' callback started !', err) });

var srv4 = new Service({ name: 'test4', script: __dirname + '\\' + 'server.js' });
var srv5 = new Service({
    name: 'test5',
    script: `${__dirname}\\server.js`,
    cwd: __dirname,
    winswPath: path.join(__dirname, '..'),
    scriptOptions: ['--port=9000']
});

attachEvents([srv4, srv5]);
srv4.install().catch(errorHandler);
srv5.install().catch(errorHandler);

function errorHandler(error) {
    console.error('caught error', error.message)
}

function attachEvents(srv) {
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
            // service.uninstall(true);
        });
    })
}
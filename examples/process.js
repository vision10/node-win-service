const win = require('../index');

// ex: node ./examples/process.js autotimesvc

var serviceName = process.argv[2];
if (!serviceName) {
    console.log('Provide a service name to work with!')
} else {
    // win.process.stop(serviceName).catch(callback)
    // win.process.start(serviceName).catch(callback)
    // win.process.restart(serviceName).catch(callback)
    win.process.list().catch(callback)
    win.process.list(serviceName, true).catch(callback)

    function callback(error) {
        console.error('error', '"' + (error && error.message) + '"')
    }
}
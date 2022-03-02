const win = require('../index');

function errorHandler(error) {
    console.error('caught error', error.message)
}

// ex: node ./examples/process.js autotimesvc

var serviceName = process.argv[2];
if (!serviceName) {
    console.log('Provide a service name to work with!')
} else {
    win.process.list().catch(errorHandler)
    win.process.list(serviceName, true).catch(errorHandler)
    
    // win.process.stop(serviceName).catch(errorHandler)
    // win.process.start(serviceName).catch(errorHandler)
    // win.process.restart(serviceName).catch(errorHandler)
}
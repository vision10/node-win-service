const win = require('../index');

function errorHandler(error) {
    console.error('caught error', error.message)
}

// ex: node ./examples/process.js autotimesvc

const serviceName = process.argv[2];

if (!serviceName) {
    console.log('Provide a service name to work with!')
} else {
    const action = process.argv[3];
    if (action == 'start') {
        win.process.start(serviceName).catch(errorHandler)
    } else if (action == 'stop') {
        win.process.stop(serviceName).catch(errorHandler)
    } else if (action == 'restart') {
        win.process.restart(serviceName).catch(errorHandler)
    } else if (action == 'kill') {
        // pidOrName, filter, force
        win.process.kill(serviceName).catch(errorHandler)
    } else {
        // filter(regex, string), verbose
        win.process.list().catch(errorHandler)
        // win.process.list(serviceName, true).catch(errorHandler)
    }
}
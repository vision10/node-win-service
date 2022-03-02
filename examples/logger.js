const { EventLogger } = require('../index');

const source = new EventLogger('source.test'); // no source should default to unkown
const application = new EventLogger({ source: 'source.aplication' });
const system = new EventLogger({ source: 'source.system', isSystem: true });
const systemV2 = new EventLogger('source.system', true);

function errorHandler(error) {
    console.error('caught error', error.message)
}

// should only ask to elevate on register, logs should not require elevation
// source.registerEventSource().catch(callback).then(writeLog1);
writeLog1()
writeLog2()
writeLog3()

function writeLog1() {
    var info = `multiline
source message info`;
    source.info(info, 'node')
    source.warn('source message warn', 'node')
    source.error('source message error', 'node')
}

function writeLog3() {
    system.info('system message info', 'node').catch(errorHandler)
    system.warn('system message warn', 'node').catch(errorHandler)
    system.error('system message error', 'node').catch(errorHandler)
}

function writeLog2() {
    application.info('application message info', 'node').catch(errorHandler)
    application.warn('application message warn', 'node').catch(errorHandler)
    application.error('application message error', 'node').catch(errorHandler)
}
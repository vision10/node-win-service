const { EventEmitter } = require('events');
const cmd = require('./cmd');

const eventlogs = ['APPLICATION', 'SYSTEM'];

function write(log, src, type, msg, id) {
  if (!msg || !msg.trim().length) { return }

  id = (+id > 0 ? +id : 1000);
  src = (src || 'Unknown Application').trim();
  type = (type || '').trim().toUpperCase();
  log = (log || '').trim().toUpperCase();
  log = eventlogs.indexOf(log) > -1 ? log : 'APPLICATION';
  msg = msg.replace(/\r\n|\n\r|\r|\n/g, "\f");
  return cmd.execute('eventcreate', `/L ${log} /T ${type} /ID ${id} /SO "${src}" /D "${msg}"`);
}

module.exports = class EventLog extends EventEmitter {
  constructor(config) {
    super();
    config = config || {};
    this.source = (typeof config == 'string' ? config : config.source) || 'Node.js';
    this.logname = config.type || config.eventLog || (config.isSystem === true ? 'SYSTEM' : 'APPLICATION');
  }

  get eventLog() { return this.logname.toUpperCase() }
  set eventLog(value) {
    if (value) {
      value = value.toUpperCase();
      this.logname = eventlogs.indexOf(value) > -1 ? value : 'APPLICATION'
    }
  }

  // Register a Windows event source.
  registerEventSource() {
    var key = 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentcontrolSet\\Services\\EventLog\\Application\\' + this.source;
    return cmd.execute('REG QUERY ' + key).then((data) => {
      this.emit('register');
      return data;
    });
  }
  info(message, code) {
    return write(this.eventLog, this.source, 'INFORMATION', message, code)
  }
  warn(message, code) {
    return write(this.eventLog, this.source, 'WARNING', message, code)
  }
  error(message, code) {
    return write(this.eventLog, this.source, 'ERROR', message, code)
  }

  /**
   * SUCCESSAUDIT is used with the security logs and you cannot write custom events to the security logs
   */
  auditSuccess(message, code) {
    return write(this.eventLog, this.source, 'SUCCESSAUDIT', message, code);
  }

  /**
   * FAILUREAUDIT is used with the security logs and you cannot write custom events to the security logs
   */
  auditFailure(message, code) {
    return write(this.eventLog, this.source, 'FAILUREAUDIT', message, code);
  }
}
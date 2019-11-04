const path = require('path');
const { existsSync } = require('fs');
const { EventEmitter } = require('events');

const cmd = require('./elevate');
const winsw = require('./winsw');

module.exports = class Service extends EventEmitter {
  constructor(config) {
    super();
    this.config = config || {};
  }

  get id() { return (this.config.id || this.config.name).replace(/[^\w]/gi, '').toLowerCase() }
  get name() { return this.config.name }
  get winswPath() {
    var p = this.config.winswPath || this.config.script;
    return path.resolve(path.dirname(p), this.config.winswDir || 'deamon');
  }
  get exists() {
    var p = path.join(this.winswPath, this.id);
    return (existsSync(p + '.exe') || existsSync(p + '.xml'));
  }

  /**
   * to get any output process needs to
   * be already running as administrator
   * or already installed as service 
   */
  status() { return this.exec('status') }

  start() { return this.exec('start') }
  stop() { return this.exec('stop') }
  restart() { return this.exec('restart') }
  selfRestart() { return this.exec('restart!') }
  install(overwrite) {
    try {
      if (!this.exists && overwrite === true)
        winsw.createFiles(this.winswPath, this.id, this.config)
    } catch (error) {
      return Promise.reject(error)
    }
    return this.exec('install')
  }
  uninstall(skipFileRemoval) {
    var un = () => {
      return this.exec('uninstall').then(() => {
        if (!skipFileRemoval) winsw.removeFiles(this.winswPath, this.id)
      })
    }
    return this.stop().then(un, error => {
      // most likely service is already stopped (cant get output from status if not elevated)
      if (/ServiceCannotAcceptControl/.test(error.message)) { return un() }
      throw error
    })
  }

  exec(command, args) {
    if (!this.config.name && !this.config.script) {
      var err = new Error('`script` and `name` properties are required but were not provided!');
      return Promise.reject(err);
    }
    var winswDir = path.join(this.winswPath, this.id);
    if (!existsSync(winswDir + '.exe')) {
      var err = new Error('WINSW executable cannot be found in (' + (winswDir + '.exe') + ')');
      this.emit('invalidinstallation', err);
      return Promise.reject(err);
    } else if (!existsSync(winswDir + '.xml')) {
      var err = new Error('WINSW configuration file cannot be found in (' + (winswDir + '.xml') + ')');
      this.emit('invalidinstallation', err);
      return Promise.reject(err);
    }
    return cmd.execute(winswDir + '.exe', [command].concat(args || [])).then((res) => {
      this.emit(command.replace('!', ''), res)
    })
  }
}
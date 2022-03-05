const path = require('path');
const { existsSync } = require('fs');
const { EventEmitter } = require('events');

const cmd = require('./cmd');
const winsw = require('./winsw');

module.exports = class Service extends EventEmitter {
  constructor(config) {
    super();
    if (!config.id && !config.script) {
      throw new Error('`id` and `script` properties are required but were not provided!')
    }
    this.config = config || {};
  }

  /**
   * If a file isn't specified, WinSW searches the executable directory for a .xml file with the same file name without the extension.
   */
  get id() { return this.config.id || this.config.name }
  get name() { return this.config.name }
  get winswPath() {
    var winPath = this.config.winswDest || this.config.deamonPath || this.config.script;
    return path.resolve(path.dirname(winPath), this.config.winswDirname || 'deamon');
  }
  get exists() {
    var p = path.join(this.winswPath, this.id);
    return (existsSync(p + '.exe') && existsSync(p + '.xml'));
  }

  status() { return this.exec('status') }

  /**
   * @param noElevate Doesn't automatically trigger a UAC prompt.
   */
  start(noElevate) { return this.exec('start', noElevate ? '--no-elevate' : undefined) }

  /**
   * @param force Stops the service even if it has started dependent services.
   * @param noWait Doesn't wait for the service to actually stop.
   * @param noElevate Doesn't automatically trigger a UAC prompt.
   */
  stop(force, noElevate, noWait) {
    const args = [];
    if (noElevate) { args.push('--no-elevate') }
    if (noWait) { args.push('--no-wait') }
    if (force) { args.push('--force') }
    return this.exec('stop', args)
  }

  /**
   * @param noElevate Doesn't automatically trigger a UAC prompt.
   */
  restart(noElevate) {
    return this.exec('restart', noElevate ? '--no-elevate' : undefined)
  }
  /**
  * @param noElevate Doesn't automatically trigger a UAC prompt.
  */
  selfRestart(noElevate) {
    return this.exec('restart!', noElevate ? '--no-elevate' : undefined)
  }

  /**
   * Refreshes the service properties without reinstallation.
   * @param options Options to change
   * @param noElevate Doesn't automatically trigger a UAC prompt.
   */
  refresh(options, noElevate) {
    if (!options) { throw new Error('options are required!') }
    return this.exec('refresh', noElevate ? '--no-elevate' : undefined)
  }

  /**
   * Customizes the wrapper executable.
   * @param output Required. Specifies the path to the output file.
   * @param manufacturer Specifies the manufacturer name of the customized executable.
   */
  customize(output, manufacturer) {
    if (!output) { throw new Error('output is required!') }
    const args = ['--outpust', output];
    if (manufacturer) { args.push('--manufacturer') }
    return this.exec('customize!', args)
  }

  /**
   * @param user|username 
   * @param pass|password 
   * @param overwrite overwrite existing files
   * @param noElevate Doesn't automatically trigger a UAC prompt.
   */
  install(options) {
    if (!options) { options = {} }
    try {
      if (!this.exists || options.overwrite === true) {
        winsw.createFiles(this.winswPath, this.config)
      }
    } catch (error) {
      return Promise.reject(error)
    }
    const args = [];
    if (options.noElevate) { args.push('--no-elevate') }
    if (options.user || options.username) {
      args.push('--username', (options.user || options.username), '--password', (options.pass || options.password || ''))
    }
    return this.exec('install', args)
  }
  /**
   * @param removeFiles // remove service specific files
   * @param forceStop // force stop service before removing it
   * @param noElevate Doesn't automatically trigger a UAC prompt.
   * @param noWait Doesn't wait for the service to actually stop.
   */
  uninstall(removeFiles, forceStop, noElevate, noWait) {
    var un = () => {
      return this.exec('uninstall', noElevate ? '--no-elevate' : undefined).then(() => {
        if (removeFiles) winsw.removeFiles(this.winswPath, this.id)
      })
    }
    return this.stop(forceStop, noElevate, noWait).then(un, error => {
      // most likely service is already stopped (cant get output from status if not elevated)
      if (/ServiceCannotAcceptControl/.test(error.message)) { return un() }
      throw error
    })
  }

  async exec(command, args) {
    var winswDir = path.join(this.winswPath, this.id);
    if (!existsSync(winswDir + '.exe')) {
      const err = new Error(`WINSW executable cannot be found in (${winswDir}.exe)`);
      this.emit('invalidinstallation', err);
      throw err;
    } else if (!existsSync(winswDir + '.xml')) {
      const err = new Error(`WINSW configuration file cannot be found in (${winswDir}.xml)`);
      this.emit('invalidinstallation', err);
      throw err;
    }

    const res = await cmd.execute(winswDir + '.exe', [command].concat(args || []));
    this.emit(command.replace('!', ''), res);
    return res;
  }
}
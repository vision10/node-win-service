// Handle input parameters
const fs = require('fs');
const net = require('net');
const path = require('path');
const { fork } = require('child_process');

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const Logger = require('./eventlog');

const max = 60;
const argv = yargs(hideBin(process.argv))
  .command({
    command: 'file', aliases: ['f', 'file'],
    desc: 'The absolute path of the script to be run as a process.',
    handler: (argv) => { return fs.existsSync(path.resolve(argv.f)) },
    builder: (yargs) => yargs.default('value', 'true'),
  }).demandCommand()
  .command({
    command: 'scriptoptions',
    desc: 'The options to be sent to the script.',
  }).demandCommand()
  .command({
    command: 'cwd', aliases: ['d', 'cwd'],
    desc: 'The absolute path of the current working directory of the script to be run as a process.',
  }).demandCommand()
  .command({
    command: 'log', aliases: ['l', 'log'],
    desc: 'The descriptive name of the log for the process',
  })
  .command({
    command: 'eventlog', aliases: ['e', 'eventlog'],
    desc: 'The event log container. This must be APPLICATION or SYSTEM.',
    handler: (argv) => { return argv.f || 'APPLICATION' },
  })
  .command({
    command: 'maxretries', aliases: ['m', 'maxretries'],
    desc: 'The maximim number of times the process will be auto-restarted.',
    handler: (argv) => { return argv.m || -1 },
  })
  .command({
    command: 'maxrestarts', aliases: ['r', 'maxrestarts'],
    desc: 'The maximim number of times the process should be restarted within a ' + max + ' second period shutting down.',
    handler: (argv) => { return argv.r || 5 },
  })
  .command({
    command: 'wait', aliases: ['w', 'wait'],
    desc: 'The number of seconds between each restart attempt.',
    handler: (argv) => { return argv.w >= 0 },
  })
  .command({
    command: 'grow', aliases: ['g', 'grow'],
    desc: 'A percentage growth rate at which the wait time is increased.',
    handler: (argv) => { return (argv.g >= 0 && argv.g <= 1) },
  })
  .command({
    command: 'abortonerror', aliases: ['a', 'abortonerror'],
    desc: 'Do not attempt to restart the process if it fails with an error,',
    builder: (yargs) => yargs.default('value', 'no'),
    handler: (argv) => { return ['y', 'n', 'yes', 'no'].indexOf(argv.a.trim().toLowerCase()) >= 0 },
  }).argv;

const wait = argv.w * 1000;
const grow = argv.g + 1;
const attempts = 0;
const startTime = null;
const starts = 0;
const child = null;
const forcekill = false;
const log = new Logger(argv.e == undefined ? argv.l : { source: argv.l, eventlog: argv.e });

if (argv.d) {
  if (!fs.existsSync(path.resolve(argv.d))) {
    console.warn(argv.d + ' not found.');
    argv.d = process.cwd();
  }
  argv.d = path.resolve(argv.d);
}

if (typeof argv.m === 'string') {
  argv.m = parseInt(argv.m);
}

argv.f = path.resolve(argv.f);

// Hack to force the wrapper process to stay open by launching a ghost socket server
var server = net.createServer().listen();

server.on('error', function (err) {
  launch('warn', err.message);
  server = net.createServer().listen();
});

/**
 * @method monitor
 * Monitor the process to make sure it is running
 */
var monitor = function () {
  if (!child || !child.pid) {

    // If the number of periodic starts exceeds the max, kill the process
    if (starts >= argv.r) {
      if (new Date().getTime() - (max * 1000) <= startTime.getTime()) {
        log.error(`Too many restarts within the last ${max} seconds. Please check the script.`);
        process.exit();
      }
    }

    setTimeout(function () {
      wait = wait * grow;
      attempts += 1;
      if (attempts > argv.m && argv.m >= 0) {
        log.error(`Too many restarts. ${argv.f} will not be restarted because the maximum number of total restarts has been exceeded.`);
        process.exit();
      } else {
        launch('warn', `Restarted ${wait} msecs after unexpected exit; attempts = ${attempts}`);
      }
    }, wait);
  } else { // reset attempts and wait time
    attempts = 0;
    wait = argv.w * 1000;
  }
};


/**
 * @method launch
 * A method to start a process.
 * logLevel - optional logging level (must be the name of a function the the Logger object)
 * msg - optional msg to log
 */
var launch = function (logLevel, msg) {

  if (forcekill) {
    log.info("Process killed");
    return;
  }

  //log.info('Starting '+argv.f);
  if (logLevel && msg) {
    log[logLevel](msg);
  }

  // Set the start time if it's null
  if (startTime == null) {
    startTime = startTime || new Date();
    setTimeout(function () {
      startTime = null;
      starts = 0;
    }, (max * 1000) + 1);
  }
  starts += 1;

  // Fork the child process
  var opts = { env: process.env };
  var args = [];
  if (argv.d) opts.cwd = argv.d;
  if (argv.s) opts.detached = true;
  if (argv.scriptoptions) args = argv.scriptoptions.split(' ');
  child = fork(path.resolve(argv.f), args, opts);

  // When the child dies, attempt to restart based on configuration
  child.on('exit', function (code) {
    log.warn(argv.f + ' stopped running.');

    // If an error is thrown and the process is configured to exit, then kill the parent.
    if (code !== 0 && argv.a == "yes") {
      log.error(argv.f + ' exited with error code ' + code);
      process.exit();
      //server.unref();
    } else if (forcekill) {
      process.exit();
    }

    child = null;
    // Monitor the process
    monitor();
  });
};

var killkid = function () {
  forcekill = true;
  if (child) {
    if (argv.s) {
      child.send('shutdown');
    } else {
      child.kill();
    }
  } else {
    log.warn('Attempted to kill an unrecognized process.')
  }
}

process.on('exit', killkid);
process.on("SIGINT", killkid);
process.on("SIGTERM", killkid);

process.on('uncaughtException', function (err) {
  launch('warn', err.message);
});

// Launch the process
launch('info', 'Starting ' + argv.f);
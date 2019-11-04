#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

var argv = require('yargs')
  .alias('n', 'name')
  .describe('name', 'The name of the service.')
  .demand('file')
  .alias('s', 'script')
  .describe('script', 'The absolute path of the script to be run as a process.')
  .check(function (argv) {
    return fs.existsSync(path.resolve(argv.d))
  })
  .alias('d', 'cwd')
  .describe('cwd', 'The absolute path of the current working directory of the script to be run as a process.\nDefaults to script directory.')
  .check(function (argv) {
    return fs.existsSync(path.resolve(argv.d))
  })
  .alias('lp', 'logpath')
  .describe('logpath', 'Path for log files generation.')
  .alias('l', 'log')
  .describe('log', 'Log options.')
  .alias('h', 'help')
  .describe('help', 'Help commands.')
  .alias('v', 'version')
  .describe('version', 'Version log, including package, winsw.exe and minimum node.js version required to run.')
  .argv


function help() {
  console.log([
    '',
    '  Package name: ' + pkg.name,
    '',
    '  Package description: ' + pkg.description,
    '',
    '  Example:',
    '    node node_modules/' + pkg.name + '/cli.js',
    ''
  ].join('\n'));
}

function version() {
  console.log([
    '* version info:',
    '* package.json version: ' + pkg.version,
    '* process.version: ' + process.version,
    ''
  ].join('\n'));
}
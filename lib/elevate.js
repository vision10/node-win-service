module.exports = {
    elevate: elevate,
    execute: execute,
}

const { join } = require('path');
const { exec } = require('child_process');
const elevateExe = join(__dirname, '..', 'bin', 'elevate.exe');

/**
 * TODO: find a better solution to elevate and get output
 */


function elevate(cmd, args, options) {
    cmd = [elevateExe, '-c', '-w'].concat(cmd || []);
    return run(cmd, args, options);
}
function execute(command, args, options) {
    return run(command, args, options).catch(function (error) {
        if (/AccessDenied|Access is denied|Administrator access/.test(error.message)) {
            return elevate(command, args, options)
        }
        throw error
    })
}
function run(cmd, args, options) {
    return new Promise(function (resolve, reject) {
        if (!cmd) { reject(new Error('Command not provided!')) }
        cmd = (Array.isArray(cmd) ? cmd : [cmd]).concat(args || []);

        exec(cmd.join(' '), options, function (error, stdout, stderr) {
            stderr = stderr.trim();
            if (stderr) {
                reject(new Error(stderr))
            } else if (error) {
                reject(error)
            } else {
                resolve(stdout && stdout.trim())
            }
        })
    })
}
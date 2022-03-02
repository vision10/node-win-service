module.exports = {
    run: run,
    elevate: elevate,
    execute: execute,
    runAsAdmin: runAsAdmin,
}

const { join } = require('path');
const { exec } = require('child_process');
const elevateExe = join(__dirname, '..', 'bin', 'elevate.exe');

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
    console.log('run', cmd, args, options)

    return new Promise(function (resolve, reject) {
        if (!cmd) { reject(new Error('Command not provided!')) }
        cmd = (Array.isArray(cmd) ? cmd : [cmd]).concat(args || []);

        console.log('exec', cmd.join(' '), options)
        exec(cmd.join(' '), options, function (error, stdout, stderr) {
            console.log('exec result', error, stdout, stderr)
            stderr = stderr && stderr.trim();
            if (stderr) { reject(new Error(stderr)) }
            else if (error) { reject(error) }
            else { resolve(stdout && stdout.trim()) }
        })
    })
}

/**
 * Runs a PowerShell command or an executable as admin
 *
 * @param command 
 *  - If a string is provided, it will be used as a command to execute in an elevated PowerShell. 
 *  - If an object with `path`, `workingDir?` is provided, the executable will be started in Run As Admin mode.
 *
 * If providing a string for elevated PowerShell, ensure the command is parsed by PowerShell
 * correctly by using an interpolated string and wrap the command in double quotes.
 * 
 * * `"Do-The-Thing -Param '${pathToFile}'"`
 */
async function runAsAdmin(command) {
    const usePowerShell = typeof command === 'string';
    const shell = new Shell({})
    await shell.addCommand('Start-Process')
    if (usePowerShell) { await shell.addArgument('PowerShell') }
    // Elevate the process
    await shell.addArgument('-Verb')
    await shell.addArgument('RunAs')
    // Hide the window for cleaner UX
    await shell.addArgument('-WindowStyle')
    await shell.addArgument('Hidden')
    // Propagate output from child process
    await shell.addArgument('-PassThru')
    // Wait for the child process to finish before exiting
    if (usePowerShell) { await shell.addArgument('-Wait') }

    if (usePowerShell) {
        // Pass argument list to use in elevated PowerShell
        await shell.addArgument('-ArgumentList')
        await shell.addArgument(command)
    } else {
        // Point to executable to run
        await shell.addArgument('-FilePath')
        await shell.addArgument(`'${command.path}'`)

        if (command.workingDir) {
            // Point to working directory to run the executable from
            await shell.addArgument('-WorkingDirectory')
            await shell.addArgument(`'${command.workingDir}'`)
        }
    }

    await shell.invoke()
    return await shell.dispose()
}
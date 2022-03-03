[![npm version](https://badge.fury.io/js/win-sv.svg)](https://badge.fury.io/js/win-sv)

Wrapper for [WinSW](https://github.com/kohsuke/winsw), event logging, Windows service manager.
- current verrsion: WinSW v3.0.0-alpha.10
- Temporarely using 2.11.0 until a more stable version is released

## Features

- **OS Service**: Run scripts (not necessarily Node.js) as native Windows services.
- **Event Logging**: Create logs in the Event log.
- **Process**:
  - _Start, Stop, Restart Services/Tasks_
  - _List Tasks_: List windows running services/tasks.
  - _Kill Task_: Kill a specific windows service/task (by PID).

## Installation

    npm install -g win-sv
  
  or  

    npm install win-sv

## Usage

- All options: [WinSW instalation guide](https://github.com/kohsuke/winsw/blob/master/doc/xmlConfigFile.md)

Minimal required options (`name`, `script`): 

```js
var { Service } = require('win-sv');

var svc = new Service({
  id: 'HelloWorld', // service name
  script: 'C:\\path\\to\\helloworld.js',
  
  // optional
  name: 'my service' // display name
  description: 'Server powered by node.js.',
});
```
A few more options
- `winswDir`: directory name for winsw instance
- `winswDest`: path where to place the winsw.exe instance, 
  - defaults to `script` path

```js
  winswDir: 'service', // default 
  winswDest: 'C:/different/path',
  // result: creates a folder named 'service' in C:/different/path/

  nodeOptions: ['--harmony'],
  // or
  execOptions: ['--harmony'],

  scriptOptions: ['--port=9000'],
  
  // simple Object or Array
  env: [
    { name: "HOME", value: process.env["USERPROFILE"] }, 
  ],

  // Run under a different User Account
  logOnAs: true, // local
  // or user account
  logOnAs: {
    domain: 'mydomain.local',
    account: 'username',
    password: 'password',
    allowservicelogon: true // optional
  },
  // or group managed service
  logOnAs: {
    domain: 'mydomain.local',
    account: 'username$', // $ - important
    allowservicelogon: true // optional
  },
  onfailure: [
    { action: "restart" delay: 10 }, // delay in seconds
    { action: "reboot" delay: 20 },
    { action: "none" },
  ] 
```

**Promise**

```js
var result = await svc.status() => Promise;
var result = await svc.start() => Promise;
var result = await svc.stop() => Promise;
var result = await svc.restart() => Promise;
var result = await svc.selfRestart() => Promise;
var result = await svc.install() => Promise;
var result = await svc.refresh() => Promise;
var result = await svc.customize() => Promise;
// auto stops if necesssary
var result = await svc.uninstall(skipFileDelete) => Promise;
```

> Note: `uninstall` only removes the OS service and process specific files not the application (file removal can be skipped).


**Events**

```js
svc.on('status', function(msg) { console.log(msg) });
svc.on('start', function(msg) { console.log(msg) });
svc.on('stop', function(msg) { console.log(msg) });
svc.on('restart', function(msg) { console.log(msg) });
svc.on('install', function(msg) { svc.start() });
svc.on('uninstall', function(msg) { console.log(msg) });
svc.on('invalidinstallation', function(msg) { console.log(msg) });
```

# Event Logging

```js
var { EventLogger } = require('win-service');

// new EventLogger(source[,isSystem]);
var log = new EventLogger('My Event Name', true);
// or
var log = new EventLogger({
  source: 'My Event Name',
  isSystem: true // optional, defaults to 'APLICATION'
});

log.info('Info log.'[,code]) => Promise;
log.warn('Warn log!'[,code]) => Promise;
log.error('Something went wrong.'[,code]) => Promise;
```

- register event in windows registry so any further messages won't require elevation. `registerEventSource` does require elevation

```js
log.registerEventSource() => Promise
```

- `isSystem` - optional, defaults to 'APLICATION'
- `code` - default `1000`,  [Microsoft docs says](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/eventcreate#parameters) valid values are between 1-1000

# Process

**start, stop, restart**

- using net start, net stop

```js
var srv = require('win-sv');

srv.process.start(serviceName) => Promise;
srv.process.stop(serviceName) => Promise;
srv.Process.restart(serviceName) => Promise;
```

**list**

Displays a list of currently running processes. 
- cmd -> tasklist 

```js
var service = require('win-sv');

service.process.list([filter][,verbose]) => Promise;
```

Output is specific to the version of the OS.  
Windows 10 output:

```js
[{
  ImageName: 'cmd.exe',
  PID: '57516',
  SessionName: 'Console',
  'Session#': '0',
  MemUsage: '1,736 K',
  Status: 'Unknown',
  UserName: 'N/A',
  CPUTime: '0:00:00',
  WindowTitle: 'N/A' 
}]
```

The non-verbose output typically provides:
- `ImageName`, `PID`, `SessionName`, `Session#`, `MemUsage`, `CPUTime`.

## kill

- cmd -> taskkill

```js
var service = require('win-sv');

service.process.kill(pid[,force]) => Promise;
// or
service.Process.kill(pid[,force]) => Promise;
```

---

## CLI

- TODO

## Licenses

`WinSW` and `elevate` are the copyrights of their respective owners 
- [WinSW.exe](https://github.com/kohsuke/winsw/releases) is distributed under MIT license.
- [elevate.exe](http://code.kliu.org/misc/elevate/) (by Kai Liu) could not find any.
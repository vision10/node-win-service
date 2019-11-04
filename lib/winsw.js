module.exports = {
  createFiles: createFiles,
  removeFiles: removeFiles,
  generateXml: generateXml,
}

const fs = require('fs');
const path = require('path');
const xml = require('xml');

function createFiles(filePath, serviceName, serviceConfig) {
  var xmlCfg = generateXml(serviceConfig);

  filePath = path.resolve(filePath || process.cwd());
  if (!fs.existsSync(filePath)) { fs.mkdirSync(filePath) }

  var winswOrigin = path.join(__dirname, '..', 'bin');
  var winswDest = path.join(filePath, serviceName);

  fs.writeFileSync(winswDest + '.xml', xmlCfg);
  var exeData = fs.readFileSync(path.join(winswOrigin, 'WinSW.exe'), { encoding: 'binary' });
  fs.writeFileSync(winswDest + '.exe', exeData, { encoding: 'binary' });
  
  // latest version does not need if anymore
  // var cfgData = fs.readFileSync(path.join(winswOrigin, 'WinSW.exe.config'), { encoding: 'binary' });
  // fs.writeFileSync(winswDest + '.exe.config', cfgData, { encoding: 'binary' });
}

function removeFiles(winswPath, name) {
  console.log('removing files', winswPath, name)
  var files = fs.readdirSync(winswPath);

  var search = new RegExp(name + '(\.(xml|exe|config)|\.(err|out|wrapper)\.log)$');
  files.filter(function (file) {
    return search.test(file)
  }).forEach(function (file) {
    fs.unlinkSync(path.join(winswPath, file))
  });
  // remove folder if empty
  var dirFiles = fs.readdirSync(winswPath);
  if (!dirFiles.length) { fs.rmdirSync(winswPath) }
}

function generateXml(config) {
  if (!config || !config.name || !config.script) {
    throw new Error("WINSW requires a minimum of name and script to run!")
  }
  function multi(tag, input, splitter) {
    if (input === undefined || input === null) { return }
    if (!Array.isArray(input)) { input = input.split(splitter || ',') }

    input.forEach(function (val) {
      var ele = {};
      ele[tag] = String(val).trim();
      xmlConfig.push(ele);
    })
  }

  var xmlConfig = [
    { id: (config.id || config.name).replace(/[^\w]/gi, '').toLowerCase() },
    { name: config.name },
    { description: config.description || '' },
    { executable: config.execPath ? path.resolve(config.execPath) : process.execPath || 'node' },
  ];
  multi('argument', config.execOptions || config.nodeOptions, ' ');
  xmlConfig.push({ argument: path.resolve(config.script.trim()) });
  multi('argument', config.scriptOptions, ' ');
  xmlConfig.push({
    workingdirectory: path.resolve(config.cwd || config.workingdirectory ? config.cwd || workingdirectory : path.dirname(config.script))
  });

  if (config.env) {
    config.env = Array.isArray(config.env) ? config.env : [config.env];
    config.env.forEach(function (env) {
      xmlConfig.push({ env: { _attr: { name: env.name, value: env.value } } })
    });
  }
  multi('depend', config.depend);

  if (config.logpath) { xmlConfig.push({ logpath: config.logpath }) }
  if (config.log) {
    var log = [{ _attr: { mode: (config.log.mode || 'append') } }];
    if (config.log.mode === 'roll-by-time') {
      log.push({ pattern: (config.log.pattern || 'yyyMMdd') })
    }
    if (config.log.mode === 'roll-by-size') {
      log.push({ sizeThreshold: (config.log.sizeThreshold || 10240) });
      log.push({ keepFiles: (config.log.keepFiles || 8) });
    }
    if (config.log.mode === 'roll-by-size-time') {
      log.push({ sizeThreshold: (config.log.sizeThreshold || 10240) });
      log.push({ pattern: (config.log.pattern || 'yyyMMdd') })
      log.push({ autoRollAtTime: (config.log.autoRollAtTime || '00:00:00') })
      log.push({ zipOlderThanNumDays: (config.log.zipOlderThanNumDays || 5) })
      log.push({ zipDateFormat: (config.log.zipDateFormat || 'yyyyMM') });
    }
    xmlConfig.push({ log: log });
  }

  if (config.priority && /Normal|Idle|High|RealTime|BelowNormal|AboveNormal/i.test(config.priority) > -1) {
    xmlConfig.push({ priority: config.priority })
  }
  if (config.startmode && /Automatic|Manual|Boot|System/i.test(config.startmode) > -1) {
    xmlConfig.push({ startmode: config.startmode })
  }
  if (config.delayedAutoStart) { xmlConfig.push({ delayedAutoStart: config.delayedAutoStart }) }
  if (config.stopparentprocessfirst) { xmlConfig.push({ stopparentprocessfirst: config.stopparentprocessfirst }) }
  if (config.stoptimeout) { xmlConfig.push({ stoptimeout: config.stoptimeout + 'sec' }) }

  if (config.logOnAs) {
    var cfg = [
      { domain: config.logOnAs.domain || 'NT AUTHORITY' },
      { user: config.logOnAs.account || 'LocalSystem' },
    ];
    if (config.logOnAs.password || !(config.logOnAs.domain && config.logOnAs.account)) {
      cfg.push({ password: config.logOnAs.password || '' })
    }
    if (config.logOnAs.allowservicelogon) { cfg.push({ allowservicelogon: config.logOnAs.allowservicelogon }) }
    xmlConfig.push({ serviceaccount: cfg });
  }

  if (config.waithint) { xmlConfig.push({ waithint: config.waithint }) }
  if (config.sleeptime) { xmlConfig.push({ sleeptime: config.sleeptime }) }

  if (config.resetfailure) { xmlConfig.push({ resetfailure: config.resetfailure }) }
  if (config.onfailure) {
    for (var i = 0; i < config.onfailure.length; i++) {
      if (['restart', 'reboot', 'none'].indexOf(config.onfailure[i].action) == -1) { continue }
      xmlConfig.push([{
        onfailure: { _attr: { action: config.onfailure[i].action, delay: config.onfailure[i].delay + ' sec' } }
      }]);
      if (i == 2) { break }
    }
  }

  // if used start script and other arguments have to be specified here
  if (config.startarguments) { xmlConfig.push({ startarguments: config.startarguments }) }

  if (config.stopexecutable) {
    xmlConfig.push({ stopexecutable: config.stopexecutable });
    xmlConfig.push({ stoparguments: config.stoparguments || '' });
  }

  if (config.interactive) { xmlConfig.push({ interactive: config.interactive }) }

  if (config.download) {
    var d = { from: config.download.from, to: config.download.to };
    if (config.download.failOnError) { d.failOnError = true }
    if (config.download.auth) { d.auth = config.download.auth }
    if (config.download.username) {
      d.username = config.download.username;
      d.password = config.download.password || '';
    }
    xmlConfig.push({ download: { _attr: d } });
  }

  if (config.beeponshutdown) {
    xmlConfig.push({ beeponshutdown: config.beeponshutdown })
  }

  return xml({ service: xmlConfig }, { indent: '\t' }).replace(/\n/g, '\r\n');
}
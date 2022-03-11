module.exports = {
  createFiles: createFiles,
  removeFiles: removeFiles,
  generateXml: generateXml,
}

const fs = require('fs');
const path = require('path');
const xml = require('xml');

function createFiles(filePath, serviceConfig) {
  const xmlCfg = generateXml(serviceConfig);

  filePath = path.resolve(filePath || process.cwd());
  if (!fs.existsSync(filePath)) { fs.mkdirSync(filePath) }

  const winswOrigin = path.join(__dirname, '..', 'bin');
  const winswDest = path.join(filePath, serviceConfig.id);

  fs.writeFileSync(winswDest + '.xml', xmlCfg);
  const exeData = fs.readFileSync(path.join(winswOrigin, 'WinSW-x64(v2.11.0).exe'), { encoding: 'binary' });
  // var exeData = fs.readFileSync(path.join(winswOrigin, 'WinSW-x64(v3.0.0.a10).exe'), { encoding: 'binary' });
  fs.writeFileSync(winswDest + '.exe', exeData, { encoding: 'binary' });
}

function removeFiles(winswPath, name) {
  var files = fs.readdirSync(winswPath);

  const search = new RegExp(name + '(\.(xml|exe|config)|\.(err|out|wrapper)\.log)$');
  files.filter(function (item) {
    return search.test(item)
  }).forEach(function (file) {
    fs.unlinkSync(path.join(winswPath, file))
  });
  // remove folder if empty
  var dirFiles = fs.readdirSync(winswPath);
  if (!dirFiles.length) { fs.rmdirSync(winswPath) }
}

function generateXml(config) {
  if (!config || !config.id || !config.script) {
    throw new Error("WINSW requires a minimum of id and script to run!")
  }
  function multiArgs(tag, input, splitter) {
    if (input === undefined || input === null) { return }
    if (!Array.isArray(input)) { input = input.split(splitter || ',') }

    input.forEach(function (val) {
      var ele = {};
      ele[tag] = String(val).trim();
      xmlConfig.push(ele);
    })
  }

  // in v3 name is not required
  // const xmlConfig = [{ id: config.id || config.name },];
  // if (config.name) { xmlConfig.push({ name: config.name }) }
  // xmlConfig.push(
  //   { description: config.description || '' },
  //   { executable: config.execPath ? path.resolve(config.execPath) : process.execPath || 'node' }
  // );
  const xmlConfig = [
    { id: config.id || config.name },
    { name: config.name },
    { description: config.description || '' },
    { executable: config.execPath ? path.resolve(config.execPath) : process.execPath || 'node' },
  ];

  multiArgs('arguments', config.execOptions || config.nodeOptions, ' ');
  xmlConfig.push({ arguments: path.resolve(config.script.trim()) });
  multiArgs('arguments', config.scriptOptions, ' ');

  const cwd = config.cwd || config.workingdirectory;
  xmlConfig.push({ workingdirectory: path.resolve(cwd ? cwd : path.dirname(config.script)) });

  if (config.env) {
    config.env = Array.isArray(config.env) ? config.env : [config.env];
    config.env.forEach(function (env) {
      xmlConfig.push({ env: { _attr: { name: env.name, value: env.value } } })
    });
  }
  multiArgs('depend', config.depend);

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

  if (config.resetfailure) { xmlConfig.push({ resetfailure: config.resetfailure }) }
  if (config.onfailure) {
    for (var i = 0; i < config.onfailure.length; i++) {
      const action = config.onfailure[i].action;
      if (['restart', 'reboot', 'none'].indexOf(action) == -1) { continue }
      xmlConfig.push({ onfailure: [{ _attr: { action: action, delay: config.onfailure[i].delay + ' sec' } }] });
      if (i == 2) { break } // max 3 options
    }
  }

  if (config.securitydescriptor) { xmlConfig.push({ securitydescriptor: config.securitydescriptor }) }

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
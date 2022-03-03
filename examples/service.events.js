module.exports = function setEvents(srv) {
    srv.forEach(service => {
        const name = service.name || service.id;
        service.on('stop', function (msg) {
            console.log(name + ' event callback stop !')
            if (msg) console.log('msg stop', msg)
        });
        service.on('uninstall', function (msg) {
            console.log(name + ' event callback uninstall !')
            if (msg) console.log('msg uninstall', msg)
        });
        service.on('install', async function (msg) {
            console.log(name + ' event callback install !')
            if (msg) console.log('msg install', msg)

            console.log('start service')
            service.start()
        });
        service.on('start', function (msg) {
            console.log(name + ' event callback start !')
            if (msg) console.log('msg start', msg)
            setTimeout(() => { service.uninstall(null, null, null, true); }, 5000);
        });
    })
}
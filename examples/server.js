'use strict';

var port = process.env.PORT || 1337;
console.log('Starting server on port: ' + port);

require('http').createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(port);

'use strict';

function getRandomPort(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const port = process.env.PORT || getRandomPort(3000, 4000);
console.log('Starting server on port: ' + port);

require('http').createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(port, () => {
    console.log('Server running on port: ' + port);
});

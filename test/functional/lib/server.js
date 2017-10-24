"use strict";

const http = require("http");

const testPort = 8989;
const testUrl = `http://localhost:${testPort}`;

const staticResponse = `<!DOCTYPE "html">
<html>
    <head>
        <title>Test Page</title>
    </head>
    <body>
        <p>Test Content</p>
    </body>
</html>
`;

module.exports.start = function (callback, html) {

    const httpServer = http.createServer(function (req, res) {

        const headers = {"Content-Type": "text/html; charset=utf-8"};

        if (callback !== undefined) {
            callback(headers);
        }

        res.writeHead(200, headers);
        res.write(html || staticResponse);
        res.end();
    });
    httpServer.listen(8989);
    return [httpServer, testUrl];
};

module.exports.stop = function (server) {
    server.close();
};

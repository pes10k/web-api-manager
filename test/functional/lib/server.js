"use strict";

const path = require("path");
const fs = require("fs");
const http = require("http");

const testPort = 8989;
const testUrl = `http://localhost:${testPort}/`;

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

/**
 * Starts the test server, serving the provided html file from the fixtures dir.
 *
 * @param {string} testHtmlFileName
 *   The name of the fixture file the test server should serve.
 * @param {function|undefined} callback
 *   An optional callback function that, if provided, will be called with
 *   a single argument, an object describing which headers will be sent from
 *   the server.  The callback function can modify this as needed.
 *
 * @return {array}
 *   An array of length two.  The first item is the server object, and the
 *   second item is the absolute URL that the server is serving from.
 */
module.exports.startWithFile = function (testHtmlFileName, callback) {
    const pathToTestHtmlFileName = path.join(__dirname, "..", "..", "fixtures", testHtmlFileName);
    const htmlFileContents = fs.readFileSync(pathToTestHtmlFileName, "utf8");
    return module.exports.start(callback, htmlFileContents);
};

module.exports.stop = function (server) {
    server.close();
};

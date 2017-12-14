"use strict";

const path = require("path");
const fs = require("fs");
const http = require("http");

const testPort = 8989;
const testUrl = `http://localhost:${testPort}/`;

const staticResponse = `<!doctype "html">
<html>
    <head>
        <title>Test Page</title>
    </head>
    <body>
        <p>Test Content</p>
        <p>Second paragraph.</p>
    </body>
</html>`;

/**
 * Starts an http server that serves a given HTML string.
 *
 * @param {?function(object)} callback
 *   An optional callback function, that if provided, is passed an object
 *   describing the HTTP headers that are sent from the test HTTP server.
 * @param {?string} html
 *   If provided, will  be returned as the body of the test HTTP
 *   respose. Otherwise, the `staticResponse` string defined in this function
 *   will be used as the body of the HTTP response.
 *
 * @return {Array.<object, string>}
 *   An array with two values, first an object representing the http server
 *   (of type http.Server, as defined by the node "http" module), and second,
 *   a string depicting a url that can be requested to get a response
 *   from the http server.
 */
module.exports.start = (callback, html) => {
    const httpServer = http.createServer((req, res) => {
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
module.exports.startWithFile = (testHtmlFileName, callback) => {
    const pathToTestHtmlFileName = path.join(__dirname, "..", "..", "fixtures", testHtmlFileName);
    const htmlFileContents = fs.readFileSync(pathToTestHtmlFileName, "utf8");
    return module.exports.start(callback, htmlFileContents);
};

module.exports.stop = server => {
    server.close();
};

"use strict";

const assert = require("assert");
const http = require("http");
const utils = require("./lib/utils");
const injected = require("./lib/injected");

describe("Basic", function () {

    const testPort = 8989;
    const testUrl = `http://localhost:${testPort}`;
    const svgTestScript = injected.testSVGTestScript();

    let httpServer;

    this.timeout = function () {
        return 10000;
    };

    beforeEach(function () {
        httpServer = http.createServer(function (req, res) {
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
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write(staticResponse);
            res.end();
        });
        httpServer.listen(8989);
    });

    afterEach(function () {
        httpServer.close();
    });

    describe("Blocking", function () {

        it("SVG Not Blocking", function (done) {
            const standardsToBlock = [];
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver, addonId) {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(function (result) {
                    return driverReference.get(testUrl);
                })
                .then(function () {
                    return driverReference.executeAsyncScript(svgTestScript);
                })
                .catch(function () {
                    // Since we're not blocking the SVG API, then the sample
                    // SVG code should throw an exception.
                    driverReference.quit();
                    done();
                });
        });

        it("SVG Blocking", function (done) {
            const standardsToBlock = ["Scalable Vector Graphics (SVG) 1.1 (Second Edition)"];
            let driverReference;
            
            utils.promiseGetDriver()
                .then(function (driver, addonId) {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(function (result) {
                    return driverReference.get(testUrl);
                })
                .then(function () {
                    return driverReference.executeAsyncScript(svgTestScript);
                })
                .then(function () {
                    driverReference.quit();
                    done();
                });
        });
    });
});
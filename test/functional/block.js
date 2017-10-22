"use strict";

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

    describe("blocking", function () {

        it("SVG Not Blocking", function (done) {
            const standardsToBlock = [];
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(() => driverReference.get(testUrl))
                .then(() => driverReference.executeAsyncScript(svgTestScript))
                .then(function () {
                    driverReference.quit();
                    done(new Error("SVG acted as if it was being blocked"));
                })
                .catch(function () {
                    // Since we're not blocking the SVG API, then the sample
                    // SVG code should throw an exception.
                    driverReference.quit();
                    done();
                });
        });

        it("SVG blocking", function (done) {

            const standardsToBlock = utils.constants.svgBlockRule;
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(() => driverReference.get(testUrl))
                .then(() => driverReference.executeAsyncScript(svgTestScript))
                .then(function () {
                    driverReference.quit();
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    done(e);
                });
        });
    });
});
"use strict";

const utils = require("./lib/utils");
const injected = require("./lib/injected");
const testServer = require("./lib/server");

describe("Basic", function () {

    const svgTestScript = injected.testSVGTestScript();

    let httpServer;
    let testUrl;

    this.timeout = function () {
        return 10000;
    };

    describe("blocking", function () {

        it("SVG Not Blocking", function (done) {

            const [server, url] = testServer.start();

            testUrl = url;
            httpServer = server;
    
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
                    testServer.stop(httpServer);
                    done(new Error("SVG acted as if it was being blocked"));
                })
                .catch(function () {
                    // Since we're not blocking the SVG API, then the sample
                    // SVG code should throw an exception.
                    driverReference.quit();
                    testServer.stop(httpServer);
                    done();
                });
        });

        it("SVG blocking", function (done) {

            const [server, url] = testServer.start();

            testUrl = url;
            httpServer = server;

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
                    testServer.stop(httpServer);
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    testServer.stop(httpServer);
                    done(e);
                });
        });

        it("iFrame contentWindow without src", function (done) {

            const testHtml = `<!DOCTYPE "html">
                <html>
                    <head>
                        <title>Test Page</title>
                    </head>
                    <body>
                        <iframe></iframe>
                    </body>
                </html>`;
            
            const iframeContentWindowScript = 'document.getElementsByTagName("iframe")[0].contentWindow.SVGGraphicsElement.prototype.getBBox().bartSimpson';

            const [server, url] = testServer.start(undefined, testHtml);

            testUrl = url;
            httpServer = server;

            const standardsToBlock = utils.constants.svgBlockRule;
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(() => driverReference.get(testUrl))
                .then(() => driverReference.executeAsyncScript(iframeContentWindowScript))
                .then(function (output) {
                    driverReference.quit();
                    testServer.stop(httpServer);
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    testServer.stop(httpServer);
                    done(e);
                });
        })
    });
});

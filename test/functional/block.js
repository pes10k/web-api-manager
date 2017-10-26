"use strict";

const utils = require("./lib/utils");
const injected = require("./lib/injected");
const testServer = require("./lib/server");

describe("Basic Functionality", function () {

    const svgTestScript = injected.testSVGTestScript();

    let httpServer;
    let testUrl;

    describe("blocking", function () {

        this.timeout = function () {
            return 20000;
        };

        it("SVG Not Blocking", function (done) {

            this.timeout = function () {
                return 10000;
            };

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

            this.timeout = function () {
                return 10000;
            };
        
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

        it("iframe contentWindow without src", function (done) {

            this.timeout = function () {
                return 10000;
            };
        
            const testHtml = `<!DOCTYPE "html">
                <html>
                    <head>
                        <title>Test Page</title>
                    </head>
                    <body>
                        <iframe></iframe>
                    </body>
                </html>`;
            
            const iframeContentWindowScript = "document.getElementsByTagName('iframe')[0].contentWindow.SVGGraphicsElement.prototype.getBBox()";

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
                .then(() => driverReference.executeScript(iframeContentWindowScript))
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

    });
});

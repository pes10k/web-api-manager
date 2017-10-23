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

    beforeEach(function () {
        const [server, url] = testServer.start();
        testUrl = url;
        httpServer = server;
    });

    afterEach(function () {
        testServer.stop(httpServer);
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

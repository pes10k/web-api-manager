"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const injected = require("./lib/injected");
const testServer = require("./lib/server");
const webdriver = require("selenium-webdriver");
const by = webdriver.By;
const until = webdriver.until;

const beaconId = 4;
const svgId = 63;

describe("Basic functionality", function () {
    const svgTestScript = injected.testSVGTestScript();

    let httpServer;
    let testUrl;

    describe("Blocking by standard", function () {
        this.timeout = () => 20000;

        it("SVG not blocking", function (done) {
            this.timeout = () => 10000;

            const [server, url] = testServer.start();

            testUrl = url;
            httpServer = server;

            const standardsToBlock = [];
            let driverRef;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseSetBlockedStandards(driverRef, standardsToBlock))
                .then(() => driverRef.get(testUrl))
                .then(() => driverRef.executeAsyncScript(svgTestScript))
                .then(() => {
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done(new Error("SVG acted as if it was being blocked"));
                })
                .catch(() => {
                    // Since we're not blocking the SVG API, then the sample
                    // SVG code should throw an exception.
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done();
                });
        });

        it("SVG blocking", function (done) {
            this.timeout = () => 10000;

            const [server, url] = testServer.start();
            const standardsToBlock = utils.constants.svgBlockRule;
            let driverRef;

            testUrl = url;
            httpServer = server;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.pause(250))
                .then(() => utils.promiseSetBlockedStandards(driverRef, standardsToBlock))
                .then(() => driverRef.get(testUrl))
                .then(() => driverRef.executeAsyncScript(svgTestScript))
                .then(() => {
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done(e);
                });
        });

        it("Proxyblock does not get stuck in infinite loop", function (done) {
            const [server, url] = testServer.startWithFile("infinite-loop.html");

            testUrl = url;
            httpServer = server;

            const selectorsApiId = 60;
            const standardsToBlock = [selectorsApiId];
            let driverRef;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseSetBlockedStandards(driverRef, standardsToBlock))
                .then(() => driverRef.get(testUrl))
                .then(() => driverRef.wait(until.elementLocated(by.css("div.success-case")), 2000))
                .then(() => {
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done(e);
                });
        });
    });

    describe("Blocking by feature", function () {
        this.timeout = () => 20000;

        it("Disable just `HTMLEmbedElement.prototype.getSVGDocument`", function (done) {
            this.timeout = () => 10000;

            const featuresToBlock = ["HTMLEmbedElement.prototype.getSVGDocument"];
            const [server, url] = testServer.start();
            let driverRef;

            testUrl = url;
            httpServer = server;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseSetBlockedFeatures(driverRef, featuresToBlock))
                .then(() => driverRef.get(testUrl))
                .then(() => driverRef.executeAsyncScript(svgTestScript))
                .then(() => {
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    testServer.stop(httpServer);
                    done(e);
                });
        });
    });

    describe("Templates", function ()  {
        this.timeout = () => 20000;
        it("Creating and applying template", function (done) {
            this.timeout = () => 10000;
            const stdIdsToBlock = [beaconId, svgId];
            const featuresToBlock = [
                "HTMLEmbedElement.prototype.getSVGDocument",
                "Performance.prototype.now",
            ];
            let driverRef;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseGetBlockedFeatures(driverRef))
                .then(blockedFeatures => {
                    assert.equal(
                        blockedFeatures.length,
                        0,
                        "By default, there should be no blocked features."
                    );

                    return utils.promiseGetBlockedStandards(driverRef);
                })
                .then(standardIds => {
                    assert.equal(
                        standardIds.length,
                        0,
                        "By default, there should be no blocked standard ids."
                    );

                    return utils.promiseSetBlockedStandards(driverRef, stdIdsToBlock);
                })
                .then(() => utils.promiseSetBlockedFeatures(driverRef, featuresToBlock))
                .then(() => utils.promiseGetBlockedFeatures(driverRef))
                .then(blockedFeatures => {
                    assert.equal(
                        JSON.stringify(blockedFeatures.sort()),
                        JSON.stringify(featuresToBlock),
                        "Default rule should have 2 blocked features"
                    );
                    return utils.promiseGetBlockedStandards(driverRef);
                })
                .then(blockedStandards => {
                    assert.equal(
                        JSON.stringify(blockedStandards.sort()),
                        JSON.stringify(stdIdsToBlock),
                        "Default rule should have 2 blocked standards"
                    );
                    return utils.promiseTemplateSave(driverRef);
                })
                .then(() => utils.promiseCreateBlockRule(driverRef, "www.example.org"))
                .then(() => utils.pause(500))
                .then(() => utils.promiseGetBlockedFeatures(driverRef))
                .then(blockedFeatures => {
                    assert.equal(
                        blockedFeatures.length,
                        0,
                        "For newly created rules, there should be no blocked features."
                    );
                    return utils.promiseGetBlockedStandards(driverRef);
                })
                .then(blockedStandards => {
                    assert.equal(
                        blockedStandards.length,
                        0,
                        "For newly created rules, there should be no blocked standards."
                    );

                    return utils.promiseTemplateApply(driverRef);
                })
                .then(() => utils.promiseGetBlockedFeatures(driverRef))
                .then(blockedFeatures => {
                    assert.equal(
                        JSON.stringify(blockedFeatures.sort()),
                        JSON.stringify(featuresToBlock),
                        "After applying the template, the rule should have 2 blocked features"
                    );
                    return utils.promiseGetBlockedStandards(driverRef);
                })
                .then(blockedStandards => {
                    assert.equal(
                        JSON.stringify(blockedStandards.sort()),
                        JSON.stringify(stdIdsToBlock),
                        "After applying the template, the rule should have 2 blocked standards"
                    );
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });
    });
});

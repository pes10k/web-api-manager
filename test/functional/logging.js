/**
 * Tests for checking that the logging system is logging which standards are
 * blocked.
 */

"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const injected = require("./lib/injected");
const testServer = require("./lib/server");
const webdriver = require("selenium-webdriver");
const by = webdriver.By;
const until = webdriver.until;

const svgTestScript = injected.testSVGTestScript();
const standardsToBlock = utils.constants.svgBlockRule;

describe("Logging", function () {

    describe("Single frame", function () {

        this.timeout = () => 20000;

        it("Blocking SVG", function (done) {

            this.timeout = () => 10000;

            const [server, url] = testServer.start();

            const testUrl = url;
            const httpServer = server;

            let driverReference;
            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(() => utils.promiseSetShouldLog(driverReference, true))
                .then(() => driverReference.get(testUrl))
                .then(() => driverReference.executeAsyncScript(svgTestScript))
                .then(() => utils.promiseOpenLoggingTab(driverReference, 1))
                .then(() => driverReference.wait(until.elementsLocated(by.css(".standard-report-container")), 1000))
                .then(standardElms => {
                    assert.equal(standardElms.length, 1, "There should only be one blocked standard.");
                    return standardElms[0].getAttribute("data-standard");
                })
                .then(standardName => {
                    assert.equal(standardName, standardsToBlock[0], `The blocked standard should be ${standardsToBlock[0]}, not ${standardName}.`);
                    return driverReference.wait(until.elementsLocated(by.css(".feature-container")), 1000);
                })
                .then(featureElms => {
                    assert.equal(featureElms.length, 1, "There should only be one blocked feature.");
                    return featureElms[0].getAttribute("data-feature");
                })
                .then(featureName => {
                    const expectedFeatureName = "HTMLEmbedElement.prototype.getSVGDocument";
                    assert.equal(featureName, expectedFeatureName, `The blocked feature should be ${expectedFeatureName}, not ${featureName}.`);
                    driverReference.quit();
                    testServer.stop(httpServer);
                    done();
                })
                .catch(e => {
                    driverReference.quit();
                    testServer.stop(httpServer);
                    done(e);
                });
        });
    });
});

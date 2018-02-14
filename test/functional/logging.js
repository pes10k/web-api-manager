/**
 * Tests for checking that the logging system is logging which standards are
 * blocked.
 */

"use strict";

const path = require("path");

const webdriver = require("selenium-webdriver");
const {until} = webdriver;
const by = webdriver.By;
const assert = require("assert");

const utils = require("./lib/utils");
const injected = require("./lib/injected");
const testServer = require("./lib/server");

const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");
// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
require(path.join(addonLibPath, "standards.js"));
const {standardsLib, enums}  = window.WEB_API_MANAGER;

const svgTestScript = injected.testSVGTestScript();
const stdIdsToBlock = utils.constants.svgBlockRule;

/**
 * Asserts that a frame report recorded the expected features in a standard.
 *
 * This test expects that no other features should be in the frame report
 * than the provided ones.
 *
 * @see add-on/background_scripts/tab_blocked_features.js
 *
 * @param {FrameReport} frameReport
 *   Object describing which features were blocked for a given frame.
 * @param {Array.FeaturePath} features
 *   An array of strings, each describing a key path in the DOM To a feature
 *   that should have been blocked.
 *
 * @return {undefined}
 */
const assertForFrameReport = (frameReport, features) => {
    const frameUrl = frameReport.url;

    // Build a mapping of standardIds -> Array.string, describing which
    // standards define the given features.
    const standardIdsToFeaturesMapping = features.reduce((collection, featureName) => {
        const standardId = standardsLib.standardIdForFeature(featureName);
        if (collection[standardId] === undefined) {
            collection[standardId] = [];
        }
        collection[standardId].push(featureName);
        return collection;
    }, Object.create(null));

    const foundStandardIds = Object.keys(standardIdsToFeaturesMapping);
    const expectedStandardIds = frameReport.getAllStandardReports().map(report => report.id);

    assert.equal(
        foundStandardIds.length,
        expectedStandardIds.length,
        `Found ${foundStandardIds.length} standards blocked for ${frameUrl}, expected ${expectedStandardIds.length}.`
    );

    foundStandardIds.forEach(standardId => {
        const standardReport = frameReport.getStandardReport(standardId);
        const expectedBlockedFeatures = standardIdsToFeaturesMapping[standardId];
        const standardName = standardsLib.nameForStandardId(standardId);

        const numExpectedBlockedFeatures = expectedBlockedFeatures.length;
        const numBlockedFeatures = standardReport.getNumBlockedFeatures();

        assert.equal(
            numExpectedBlockedFeatures,
            numBlockedFeatures,
            `Found ${numBlockedFeatures} features blocked in ${standardName} on ${frameUrl}, expected ${numExpectedBlockedFeatures}`
        );

        expectedBlockedFeatures.forEach(featureName => {
            assert.equal(
                true,
                standardReport.wasFeatureBlocked(featureName),
                `Did not find ${featureName} in array of features blocked in ${standardName} on ${frameUrl}`
            );
        });
    });
};

describe("Logging", function () {
    describe("No logging", function () {
        this.timeout = () => 20000;
        it("Blocking nothing", function (done) {
            this.timeout = () => 10000;
            const [server, url] = testServer.start();
            const testUrl = url;
            const httpServer = server;
            let driverRef;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseSetBlockedStandards(driverRef, stdIdsToBlock))
                .then(() => utils.promiseSetShouldLog(driverRef, enums.ShouldLogVal.STANDARD))
                .then(() => driverRef.get(testUrl))
                .then(() => utils.promiseGetBlockReport(driverRef))
                .then(blockReport => {
                    const frameReports = blockReport.getFrameReportsForUrl(testUrl);
                    assert.equal(frameReports.length, 1, "There should be one frame reported that had no content blocked on it.");

                    const frameReport = frameReports[0];
                    assert.equal(frameReport.url, testUrl, "Frame should report the test URL was not blocked.");
                    const numStandardsInFrame = frameReport.getAllStandardReports().length;
                    assert.equal(numStandardsInFrame, 0, "There should be no features blocked in the frame");
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

    describe("Standard logging", function () {
        describe("Single tab", function () {
            this.timeout = () => 20000;

            it("Blocking SVG", function (done) {
                this.timeout = () => 10000;

                const [server, url] = testServer.start();

                const testUrl = url;
                const httpServer = server;

                let driverRef;
                utils.promiseGetDriver()
                    .then(driver => {
                        driverRef = driver;
                        return utils.promiseExtensionConfigPage(driverRef);
                    })
                    .then(() => utils.promiseSetBlockedStandards(driverRef, stdIdsToBlock))
                    .then(() => utils.promiseSetShouldLog(driverRef, enums.ShouldLogVal.STANDARD))
                    .then(() => driverRef.get(testUrl))
                    .then(() => driverRef.executeAsyncScript(svgTestScript))
                    .then(() => utils.promiseGetBlockReport(driverRef))
                    .then(blockReport => {
                        const frameReports = blockReport.getFrameReportsForUrl(testUrl);
                        assert.equal(frameReports.length, 1, "There should be one frame reported.");

                        const frameReport = frameReports[0];
                        assertForFrameReport(frameReport, ["HTMLEmbedElement.prototype.getSVGDocument"]);

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

            it("Blocking Crypto in a frame, and SVG in the parent document", function (done) {
                this.timeout = () => 10000;
                const [server, url] = testServer.startWithFile("embedded-frames.html");
                const testUrl = url;
                const httpServer = server;
                const webCryptoStdId = 71;
                const svgAndCryptoStdIds = stdIdsToBlock.concat([webCryptoStdId]);
                let driverRef;

                utils.promiseGetDriver()
                    .then(driver => {
                        driverRef = driver;
                        return utils.promiseExtensionConfigPage(driverRef);
                    })
                    .then(() => utils.promiseSetBlockedStandards(driverRef, svgAndCryptoStdIds))
                    .then(() => utils.promiseSetShouldLog(driverRef, enums.ShouldLogVal.STANDARD))
                    .then(() => driverRef.get(testUrl))
                    .then(() => driverRef.executeAsyncScript(svgTestScript))
                    .then(() => utils.promiseGetBlockReport(driverRef))
                    .then(blockReport => {
                        const parentFrameReports = blockReport.getFrameReportsForUrl(testUrl);
                        assert.equal(
                            parentFrameReports.length,
                            1,
                            `There should be one frame report for ${testUrl}.`
                        );
                        const [frameReportForParentFrame] = parentFrameReports;
                        assertForFrameReport(frameReportForParentFrame, ["HTMLEmbedElement.prototype.getSVGDocument"]);

                        // Next, check that the given report contains the expected
                        // blocked features for the injected frame.
                        const frameReportsForChildFrame = blockReport.getFrameReportsForUrl("about:srcdoc");
                        assert.equal(
                            frameReportsForChildFrame.length,
                            1,
                            `There should be one frame report for about:blank.`
                        );
                        const frameReportForChildFrame = frameReportsForChildFrame[0];
                        assertForFrameReport(frameReportForChildFrame, ["Crypto.prototype.getRandomValues"]);
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

        describe("Two tabs", function () {
            this.timeout = () => 20000;

            it("Handling closed tabs", function (done) {
                this.timeout = () => 10000;
                const [server, url] = testServer.start();
                const testUrl = url;
                const httpServer = server;

                let firstTabHandle;
                let driverRef;

                utils.promiseGetDriver()
                    .then(driver => {
                        driverRef = driver;
                        return utils.promiseExtensionConfigPage(driverRef);
                    })
                    .then(() => utils.promiseSetShouldLog(driverRef, enums.ShouldLogVal.STANDARD))
                    .then(() => driverRef.get(testUrl))
                    .then(() => utils.promiseGetBlockReport(driverRef))
                    .then(blockReport => {
                        const tabReports = blockReport.getAllTabReports();
                        assert.equal(tabReports.length, 1, "There should be one tab report.");
                        return utils.promiseOpenNewTab(driverRef, testUrl);
                    })
                    .then(tabHandles => {
                        firstTabHandle = tabHandles.prior;
                        return utils.promiseGetBlockReport(driverRef);
                    })
                    .then(blockReport => {
                        const tabReports = blockReport.getAllTabReports();
                        assert.equal(tabReports.length, 2, "There should be two tab reports.");
                        return driverRef.close();
                    })
                    .then(() => driverRef.switchTo().window(firstTabHandle))
                    .then(() => utils.promiseGetBlockReport(driverRef))
                    .then(blockReport => {
                        const tabReports = blockReport.getAllTabReports();
                        assert.equal(tabReports.length, 1, "There should be one tab report again now.");
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
    });

    describe("Passive logging", function () {
        this.timeout = () => 20000;

        it("Check standard DOM functionality works", function (done) {
            this.timeout = () => 5000;

            const [server, url] = testServer.startWithFile("basic-modification.html");
            const testUrl = url;
            const httpServer = server;
            let driverRef;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseSetShouldLog(driverRef, enums.ShouldLogVal.PASSIVE))
                .then(() => driverRef.get(testUrl))
                // First check to see if the document looks the way we expect
                // it to (ie the script was able to run as expected).  We
                // don't expect to find the old header, and do expect to
                // find the new header.
                .then(() => driverRef.wait(until.elementLocated(by.css("#old-header")), 250))
                // If this then branch executes, it means that the page
                // wasn't modified as expected, since the old
                // header element was found.
                .then(() => {
                    driverRef.quit();
                    testServer.stop(server);
                    done(new Error("Page was not modified as expected, old header element still found."));
                })
                // This catch block is the expected, "success" condition.
                // Now check that the new header is present in the page
                // too.
                .catch(() => driverRef.wait(until.elementLocated(by.css("#new-header")), 250))
                // Next check the block report, to make sure all the
                // captured functionality on the page was recorded.
                .then(() => utils.promiseGetBlockReport(driverRef))
                .then(blockReport => {
                    const frameReports = blockReport.getFrameReportsForUrl(testUrl);
                    assert.equal(frameReports.length, 1, "There should be one frame reported.");

                    const frameReport = frameReports[0];
                    assertForFrameReport(frameReport, [
                        "Document.prototype.createElement",
                        "Document.prototype.createTextNode",
                        "Document.prototype.getElementsByTagName",
                        "Node.prototype.appendChild",
                        "Node.prototype.removeChild",
                        // Not called by the fixture, but by the test runner
                        "EventTarget.prototype.removeEventListener",
                        "window.open",

                    ]);
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
});

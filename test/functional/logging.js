/**
 * Tests for checking that the logging system is logging which standards are
 * blocked.
 */

"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const injected = require("./lib/injected");
const testServer = require("./lib/server");

const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");
// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
require(path.join(addonLibPath, "standards.js"));
const standardsLib = window.WEB_API_MANAGER.standardsLib;

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
 *   An array of strings, each describing a key path in the dom to a feature
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
        expectedStandardIds.length,
        foundStandardIds.length,
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
    describe("Single tab", function () {
        this.timeout = () => 20000;

        it("Blocking nothing", function (done) {
            this.timeout = () => 10000;
            const [server, url] = testServer.start();

            const testUrl = url;
            const httpServer = server;

            let driverReference;
            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, stdIdsToBlock);
                })
                .then(() => utils.promiseSetShouldLog(driverReference, true))
                .then(() => driverReference.get(testUrl))
                .then(() => utils.promiseGetBlockReport(driverReference))
                .then(blockReport => {
                    const frameReports = blockReport.getFrameReportsForUrl(testUrl);
                    assert.equal(frameReports.length, 1, "There should be one frame reported that had no content blocked on it.");

                    const frameReport = frameReports[0];
                    assert.equal(frameReport.url, testUrl, "Frame should report the test URL was not blocked.");
                    const numStandardsInFrame = frameReport.getAllStandardReports().length;
                    assert.equal(numStandardsInFrame, 0, "There should be no features blocked in the frame");
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

        it("Blocking SVG", function (done) {
            this.timeout = () => 10000;

            const [server, url] = testServer.start();

            const testUrl = url;
            const httpServer = server;

            let driverReference;
            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, stdIdsToBlock);
                })
                .then(() => utils.promiseSetShouldLog(driverReference, true))
                .then(() => driverReference.get(testUrl))
                .then(() => driverReference.executeAsyncScript(svgTestScript))
                .then(() => utils.promiseGetBlockReport(driverReference))
                .then(blockReport => {
                    const frameReports = blockReport.getFrameReportsForUrl(testUrl);
                    assert.equal(frameReports.length, 1, "There should be one frame reported.");

                    const frameReport = frameReports[0];
                    assertForFrameReport(frameReport, ["HTMLEmbedElement.prototype.getSVGDocument"]);

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

        it("Blocking Crypto in a frame, and SVG in the parent document", function (done) {
            this.timeout = () => 10000;

            const [server, url] = testServer.startWithFile("embedded-frames.html");

            const testUrl = url;
            const httpServer = server;
            const webCryptoStandardId = "Web Cryptography API";

            const svgAndCryptoStandardIds = stdIdsToBlock.concat([webCryptoStandardId]);

            let driverReference;
            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, svgAndCryptoStandardIds);
                })
                .then(() => utils.promiseSetShouldLog(driverReference, true))
                .then(() => driverReference.get(testUrl))
                .then(() => driverReference.executeAsyncScript(svgTestScript))
                .then(() => utils.promiseGetBlockReport(driverReference))
                .then(blockReport => {
                    const frameReportsForParentFrame = blockReport.getFrameReportsForUrl(testUrl);
                    assert.equal(
                        frameReportsForParentFrame.length,
                        1,
                        `There should be one frame report for ${testUrl}.`
                    );
                    const [frameReportForParentFrame] = frameReportsForParentFrame;
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

    describe("Two tabs", function () {
        this.timeout = () => 20000;

        it("Handling closed tabs", function (done) {
            this.timeout = () => 10000;
            const [server, url] = testServer.start();
            const testUrl = url;
            const httpServer = server;

            let firstTabHandle;
            let driverReference;

            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseSetShouldLog(driverReference, true);
                })
                .then(() => driverReference.get(testUrl))
                .then(() => utils.promiseGetBlockReport(driverReference))
                .then(blockReport => {
                    const tabReports = blockReport.getAllTabReports();
                    assert.equal(tabReports.length, 1, "There should be one tab report.");
                    return utils.promiseOpenNewTab(driverReference, testUrl);
                })
                .then(tabHandles => {
                    firstTabHandle = tabHandles.prior;
                    return utils.promiseGetBlockReport(driverReference);
                })
                .then(blockReport => {
                    const tabReports = blockReport.getAllTabReports();
                    assert.equal(tabReports.length, 2, "There should be two tab reports.");
                    return driverReference.close();
                })
                .then(() => driverReference.switchTo().window(firstTabHandle))
                .then(() => utils.promiseGetBlockReport(driverReference))
                .then(blockReport => {
                    const tabReports = blockReport.getAllTabReports();
                    assert.equal(tabReports.length, 1, "There should be one tab report again now.");
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

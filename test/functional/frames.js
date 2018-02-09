"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const testServer = require("./lib/server");

const standardsToBlock = utils.constants.svgBlockRule;

describe("Cross frame protections", function () {
    describe("iframes", function () {
        describe("HTMLIFrameElement.prototype.contentWindow property", function () {
            this.timeout = () => 20000;
            let testScript = "";
            testScript += "let iframeWindow = document.getElementsByTagName('iframe')[0].contentWindow;\n";
            testScript += "return iframeWindow.SVGGraphicsElement.prototype.getBBox === iframeWindow.SVGTransformList.prototype.createSVGTransformFromMatrix;";

            // If access to the child frame's SVGGraphicsElement.prototype.getBBox
            // implementation is *not* blocked, then trying to call it
            // will throw, since its being called without a context.
            it("Can access w/o blocking", function (done) {
                const [server, url] = testServer.startWithFile("basic-iframe.html");
                let driverReference;

                utils.promiseGetDriver()
                    .then(function (driver) {
                        driverReference = driver;
                        return driverReference.get(url);
                    })
                    .then(() => driverReference.executeScript(testScript))
                    .then(response => {
                        assert.equal(response, false, "When not blocking, SVGGraphicsElement.prototype.getBBox and SVGTransformList.prototype.createSVGTransformFromMatrix should reference different functions.");
                        driverReference.quit();
                        testServer.stop(server);
                        done();
                    })
                    .catch(e => {
                        driverReference.quit();
                        testServer.stop(server);
                        done(e);
                    });
            });

            it("Can not access when blocking", function (done) {
                const [server, url] = testServer.startWithFile("basic-iframe.html");
                let driverReference;

                utils.promiseGetDriver()
                    .then(driver => {
                        driverReference = driver;
                        return driverReference.get(url);
                    })
                    .then(() => utils.promiseSetBlockingRules(driverReference, standardsToBlock))
                    .then(() => utils.promiseSetBlockCrossFrame(driverReference, true))
                    .then(() => driverReference.get(url))
                    .then(() => driverReference.executeScript(testScript))
                    .then(response => {
                        assert.equal(response, true, "When blocking, SVGGraphicsElement.prototype.getBBox and SVGTransformList.prototype.createSVGTransformFromMatrix should reference the same proxy object.");
                        driverReference.quit();
                        testServer.stop(server);
                        done();
                    })
                    .catch(e => {
                        driverReference.quit();
                        testServer.stop(server);
                        done(e);
                    });
            });
        });
    });

    describe("window.open", function () {
        this.timeout = () => 20000;
        const openWindowScript = "window.childWindow = window.open(window.location.href);";
        const testWindowNameScript = `
            let foreignGetElementsByTagName = window.childWindow.Document.prototype.getElementsByTagName;
            let numPElms = foreignGetElementsByTagName.call(window.document, 'p').length;
            return JSON.stringify(numPElms);
        `;

        it("Can access child DOM w/o blocking", function (done) {
            this.timeout = () => 20000;
            const [server, url] = testServer.start();
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return driverReference.get(url);
                })
                .then(() => driverReference.executeScript(openWindowScript))
                .then(() => driverReference.executeScript(testWindowNameScript))
                .then(isChildWindowTitleCorrect => {
                    assert.equal(
                        isChildWindowTitleCorrect,
                        2,
                        "When no standards are blocked, pages should be able to access the DOM of opened windows."
                    );
                    driverReference.quit();
                    testServer.stop(server);
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    testServer.stop(server);
                    done(e);
                });
        });

        it("Cannot access child DOM with blocking", function (done) {
            this.timeout = () => 10000;
            const [server, url] = testServer.start();
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driverReference, standardsToBlock);
                })
                .then(() => utils.promiseSetBlockCrossFrame(driverReference, true))
                .then(() => driverReference.get(url))
                .then(() => driverReference.executeScript(openWindowScript))
                .then(() => driverReference.executeScript(testWindowNameScript))
                .then(isChildWindowTitleCorrect => {
                    assert.equal(
                        isChildWindowTitleCorrect,
                        null,
                        "When any standard is block, pages should not be able to access the DOM of opened windows."
                    );
                    driverReference.quit();
                    testServer.stop(server);
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    testServer.stop(server);
                    done(e);
                });
        });
    });
});

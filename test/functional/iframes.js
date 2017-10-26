"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const testServer = require("./lib/server");

describe("iFrames", function () {

    describe("HTMLIFrameElement.prototype.contentWindow property", function () {

        this.timeout = () => 20000;

        const standardsToBlock = utils.constants.svgBlockRule;

        const testHtml = `<!DOCTYPE "html">
            <html>
                <head>
                    <title>Test Page</title>
                </head>
                <body>
                    <iframe src=""></iframe>
                </body>
            </html>`;

        let testScript = "";
        testScript += "let iframeWindow = document.getElementsByTagName('iframe')[0].contentWindow;\n";
        testScript += "return iframeWindow.SVGGraphicsElement.prototype.getBBox === iframeWindow.SVGTransformList.prototype.createSVGTransformFromMatrix;";

        // If access to the child frame's SVGGraphicsElement.prototype.getBBox
        // implementation is *not* blocked, then trying to call it
        // will throw, since its being called without a context.
        it("Can access w/o blocking", function (done) {

            const [server, url] = testServer.start(undefined, testHtml);
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return driverReference.get(url);
                })
                .then(() => driverReference.executeScript(testScript))
                .then(function (response) {
                    assert.equal(response, false, "When not blocking, SVGGraphicsElement.prototype.getBBox and SVGTransformList.prototype.createSVGTransformFromMatrix should reference different functions.");
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

        it("Can not access when blocking", function (done) {

            const [server, url] = testServer.start(undefined, testHtml);
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return driverReference.get(url);
                })
                .then(() => utils.promiseSetBlockingRules(driverReference, standardsToBlock))
                .then(() => driverReference.get(url))
                .then(() => driverReference.executeScript(testScript))
                .then(function (response) {
                    assert.equal(response, true, "When blocking, SVGGraphicsElement.prototype.getBBox and SVGTransformList.prototype.createSVGTransformFromMatrix should reference the same proxy object.");
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

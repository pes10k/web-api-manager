"use strict";

const utils = require("./lib/utils");
const injected = require("./lib/injected");
const testServer = require("./lib/server");

describe("Content-Security-Protocol Issues", function () {
    describe("script-src", function () {
        this.timeout = () => 20000;

        it("default-src and script-src (from Pitchfork.com)", function (done) {
            const [server, testUrl] = testServer.start(headers => {
                // Add the CSP header to every request
                const pitchforkCSP = [
                    "default-src https: data: 'unsafe-inline' 'unsafe-eval';",
                    "child-src https: data: blob:; connect-src https: data: blob:;",
                    "font-src https: data:; img-src https: data: blob:;",
                    "media-src https: data: blob:;",
                    "object-src https:;",
                    "script-src https: data: blob: 'unsafe-inline' 'unsafe-eval';",
                    "style-src https: 'unsafe-inline';",
                ];
                headers["Content-Security-Protocol"] = pitchforkCSP.join(" ");
            });

            const svgTestScript = injected.testSVGTestScript();
            const standardsToBlock = utils.constants.svgBlockRule;
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
                    testServer.stop(server);
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    testServer.stop(server);
                    done(e);
                });
        });
    });
});

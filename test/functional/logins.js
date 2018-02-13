"use strict";

const utils = require("./lib/utils");
let testParams;
try {
    testParams = require("../../test.config.js");
} catch (e) {
    throw "Unable to load a test.config.js module in the project root. Copy test.config.example.js to test.config.js.";
}
const injected = require("./lib/injected");
const webdriver = require("selenium-webdriver");
const keys = webdriver.Key;
const by = webdriver.By;
const until = webdriver.until;


describe("Logging into popular sites", function () {
    if (utils.shouldRunRemoteTests === false) {
        // Skipping remote tests because of --only-local-tests flag
        return;
    }

    describe("GitHub", function () {
        if (!testParams.github.username) {
            console.log(" * No Github account information in test.config.js, skipping these tests.");
            return;
        }

        const formValues = [
            ["login", testParams.github.username],
            ["password", testParams.github.password],
        ];

        this.timeout = function () {
            return 10000;
        };

        it("Log in", function (done) {
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return driverReference.get("https://github.com/login");
                })
                .then(function () {
                    return driverReference.wait(until.elementLocated(by.name("password")), 2000);
                })
                .then(() => utils.promiseSetFormAndSubmit(driverReference, formValues))
                .then(function () {
                    return driverReference.wait(until.elementLocated(by.css("body.logged-in")), 2000);
                })
                .then(function () {
                    driverReference.quit();
                    done();
                })
                .catch(function () {
                    driverReference.quit();
                    done(new Error("Was not able to log in"));
                });
        });

        it("Log in with SVG blocking", function (done) {
            const standardsToBlock = utils.constants.svgBlockRule;
            const svgTestScript = injected.testSVGTestScript();
            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return utils.promiseSetBlockedStandards(driver, standardsToBlock);
                })
                .then(() => driverReference.get("https://github.com/login"))
                .then(function () {
                    return driverReference.wait(until.elementLocated(by.name("password")), 2000);
                })
                .then(() => utils.promiseSetFormAndSubmit(driverReference, formValues))
                .then(function () {
                    return driverReference.wait(until.elementLocated(by.css("body.logged-in")), 2000);
                })
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

    describe("Facebook", function () {
        if (!testParams.facebook.username) {
            console.log(" * No Facebook account information in test.config.js, skipping these tests.");
            return;
        }

        this.timeout = function () {
            return 20000;
        };

        it("Log in", function (done) {
            const formValues = [
                ["email", testParams.facebook.username],
                ["pass", testParams.facebook.password],
            ];

            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return driverReference.get("https://www.facebook.com/");
                })
                .then(function () {
                    return driverReference.wait(until.elementsLocated(by.name("email")), 5000);
                })
                .then(() => utils.promiseSetFormAndSubmit(driverReference, formValues))
                .then(function () {
                    return driverReference.wait(until.elementLocated(by.css("div[data-click='profile_icon']")), 10000);
                })
                .then(function () {
                    driverReference.quit();
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    console.log(e);
                    done(new Error("Was not able to log in"));
                });
        });
    });

    describe("YouTube", function () {
        if (!testParams.google.username) {
            console.log(" * No Google/YouTube account information in test.config.js, skipping these tests.");
            return;
        }

        this.timeout = function () {
            return 30000;
        };

        it("Log in", function (done) {
            let driver;

            utils.promiseGetDriver()
                .then(function (testDriver) {
                    driver = testDriver;
                    return driver.get("https://www.youtube.com");
                })
                .then(function () {
                    return driver.wait(until.elementsLocated(by.css("#buttons ytd-button-renderer a")), 5000);
                })
                .then(anchors => anchors[anchors.length - 1].click())
                .then(() => utils.pause(2000))
                .then(function () {
                    return driver.wait(until.elementLocated(by.name("identifier")), 5000);
                })
                .then(idElm => driver.wait(until.elementIsVisible(idElm)))
                .then(idElm => idElm.sendKeys(testParams.google.username, keys.ENTER))
                .then(() => utils.pause(2000))
                .then(function () {
                    return driver.wait(until.elementLocated(by.name("password")), 5000);
                })
                .then(passwordElm => driver.wait(until.elementIsVisible(passwordElm)))
                .then(passwordElm => passwordElm.sendKeys(testParams.google.password, keys.ENTER))
                .then(function () {
                    return driver.wait(until.elementLocated(by.css("ytd-app")), 10000);
                })
                .then(function () {
                    driver.quit();
                    done();
                })
                .catch(function () {
                    driver.quit();
                    done(new Error("Was not able to log in"));
                });
        });
    });
});

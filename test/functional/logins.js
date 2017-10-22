"use strict";

const utils = require("./lib/utils");
let testParams
try {
    testParams = require("../../test.config.js");
} catch (e) {
    throw "Unable to load a test.config.js module in the project root.  Copy test.config.example.js to test.config.js and try again";
}
const injected = require("./lib/injected");
const webdriver = require("selenium-webdriver");
const keys = webdriver.Key;
const by = webdriver.By;
const until = webdriver.until;


describe("Logging into popular sites", function () {

    describe("GitHub", function () {

        const formValues = [
            ["login", testParams.github.username],
            ["password", testParams.github.password]
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
                    return driverReference.wait(until.elementLocated(
                        by.name("password")
                    ), 2000);
                })
                .then(() => utils.promiseSetFormAndSubmit(driverReference, formValues))
                .then(function () {
                    return driverReference.wait(until.elementLocated(
                        by.css("body.logged-in")
                    ), 2000);
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
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(() => driverReference.get("https://github.com/login"))
                .then(function () {
                    return driverReference.wait(until.elementLocated(
                        by.name("password")
                    ), 2000);
                })
                .then(() => utils.promiseSetFormAndSubmit(driverReference, formValues))
                .then(function () {
                    return driverReference.wait(until.elementLocated(
                        by.css("body.logged-in")
                    ), 2000);
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

    describe("YouTube", function () {

        this.timeout = function () {
            return 20000;
        };

        it("Log in", function (done) {

            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return driverReference.get("https://www.youtube.com");
                })
                .then(function () {
                    return driverReference.wait(until.elementsLocated(
                        by.css("#buttons ytd-button-renderer a")
                    ), 2000);
                })
                .then(anchors => anchors[anchors.length - 1].click())
                .then(() => utils.pause(2000))
                .then(function () {
                    return driverReference.wait(until.elementLocated(
                        by.name("identifier")
                    ), 3000);
                })
                .then(identifierElm => driverReference.wait(until.elementIsVisible(identifierElm)))
                .then(identifierElm => identifierElm.sendKeys(testParams.google.username, keys.ENTER))
                .then(() => utils.pause(2000))
                .then(function () {
                    return driverReference.wait(until.elementLocated(
                        by.name("password")
                    ), 3000);
                })
                .then(passwordElm => driverReference.wait(until.elementIsVisible(passwordElm)))
                .then(passwordElm => passwordElm.sendKeys(testParams.google.password, keys.ENTER))
                .then(function () {
                    return driverReference.wait(until.elementLocated(
                        by.css("ytd-app")
                    ), 40000);
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
});

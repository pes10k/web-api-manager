/**
 * These tests ensure that the listing of blocking rules in the config
 * page work as expected.  The code being targeted is, for the most part,
 * in the add-on/config/js/vue_components/blocking-rules.vue.js file.
 */
"use strict";

const utils = require("./lib/utils");
const webdriver = require("selenium-webdriver");
const by = webdriver.By;
const until = webdriver.until;
const standardsToBlock = utils.constants.svgBlockRule;

const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");
// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
const {constants} = window.WEB_API_MANAGER;
const {defaultPattern} = constants;

describe("Config panel: Blocking rules", function () {
    describe("Blocking nothing", function () {
        this.timeout = () => 20000;
        it("default rule is initially in the 'allow all' section", function (done) {
            let driverReference;
            const queryString = `.patterns-allowing-all-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => driverReference.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverReference.quit();
                    done();
                })
                .catch(e => {
                    driverReference.quit();
                    done(e);
                });
        });

        it("Initially nothing should be in the 'blocking anything' section", function (done) {
            let driverReference;
            const queryString = `.patterns-blocking-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => driverReference.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverReference.quit();
                    done(new Error("There should not have been any inputs in the 'blocking any standards' section."));
                })
                .catch(() => {
                    driverReference.quit();
                    done();
                });
        });
    });

    describe("When blocking", function () {
        this.timeout = () => 20000;
        it("default rule should move into 'blocking anything' section after blocking a standard", function (done) {
            let driverReference;
            const queryString = `.patterns-blocking-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(() => driverReference.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverReference.quit();
                    done();
                })
                .catch(e => {
                    driverReference.quit();
                    done(e);
                });
        });

        it("Nothing should be in the 'allowing all' section after setting a standard to block", function (done) {
            let driverReference;
            const queryString = `.patterns-allowing-all-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                })
                .then(() => driverReference.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverReference.quit();
                    done(new Error("There should not be any rules in the 'allow all' section"));
                })
                .catch(() => {
                    driverReference.quit();
                    done();
                });
        });
    });
});

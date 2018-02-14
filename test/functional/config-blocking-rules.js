/**
 * These tests ensure that the listing of blocking rules in the config
 * page work as expected.  The code being targeted is, for the most part,
 * in the add-on/config/js/vue_components/blocking-rules.vue.js file.
 */
"use strict";

const assert = require("assert");
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
    describe("Rule categorization", function () {
        this.timeout = () => 20000;
        it("Default rule is initially in the 'allow all' section", function (done) {
            let driverRef;
            const queryString = `.patterns-allowing-all-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => driverRef.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });

        it("Initially nothing should be in the 'blocking anything' section", function (done) {
            let driverRef;
            const queryString = `.patterns-blocking-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => driverRef.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverRef.quit();
                    done(new Error("There should not have been any inputs in the 'blocking any standards' section."));
                })
                .catch(() => {
                    driverRef.quit();
                    done();
                });
        });

        it("Default rule should move into 'blocking anything' section after blocking a standard", function (done) {
            let driverRef;
            const queryString = `.patterns-blocking-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => utils.promiseSetBlockedStandards(driverRef, standardsToBlock))
                .then(() => driverRef.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });

        it("Nothing should be in the 'allowing all' section after setting a standard to block", function (done) {
            let driverRef;
            const queryString = `.patterns-allowing-all-section input[value='${defaultPattern}']`;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => utils.promiseSetBlockedStandards(driverRef, standardsToBlock))
                .then(() => driverRef.wait(until.elementLocated(by.css(queryString)), 1000))
                .then(() => {
                    driverRef.quit();
                    done(new Error("There should not be any rules in the 'allow all' section"));
                })
                .catch(() => {
                    driverRef.quit();
                    done();
                });
        });
    });

    describe("Creating new rules", function () {
        this.timeout = () => 20000;
        it("Create new 'www.example.org' blocking rule", function (done) {
            let driverRef;
            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => utils.promiseCreateBlockRule(driverRef, "www.example.org"))
                .then(() => {
                    const query = ".patterns-allowing-all-section input[value='www.example.org']";
                    return driverRef.wait(until.elementLocated(by.css(query)), 1000);
                })
                .then(() => {
                    driverRef.quit();
                    done();
                })
                .catch(() => {
                    driverRef.quit();
                    done(new Error("The 'www.example.org' rule did not appear in the 'Allowing all' section"));
                });
        });

        it("Error when creating empty rule", function (done) {
            let driverRef;
            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => driverRef.wait(until.elementLocated(by.css(".patterns-new-section button")), 1000))
                .then(submitButton => submitButton.click())
                .then(() => {
                    const query = ".patterns-new-section .alert-danger";
                    return driverRef.wait(until.elementLocated(by.css(query)), 1000);
                })
                .then(() => {
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });
    });

    describe("Template panel", function () {
        this.timeout = () => 20000;

        const promiseGetCurrentTemplateDescription = driver => {
            return utils.promiseOpenCustomConfigContainer(driver)
                .then(() => driver.wait(until.elementLocated(by.id("template-description")), 1000))
                .then(pElm => pElm.getAttribute("innerText"));
        };

        it("Template description is correct when saving a template", function (done) {
            let driverRef;
            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driver);
                })
                .then(() => promiseGetCurrentTemplateDescription(driverRef))
                .then(templateDesc => {
                    assert.equal(
                        templateDesc,
                        "The current template blocks 0 features and 0 standards.",
                        "Initially no features or standards should be in the template rule."
                    );
                    return utils.promiseSetBlockedStandards(driverRef, [1, 2, 3]);
                })
                .then(() => utils.promiseTemplateSave(driverRef))
                .then(() => promiseGetCurrentTemplateDescription(driverRef))
                .then(templateDesc => {
                    assert.equal(
                        templateDesc,
                        "The current template blocks 16 features and 3 standards.",
                        "Template description should indicate three new blocked standards."
                    );
                    return utils.promiseSetBlockedFeatures(driverRef, [
                        "Performance.prototype.now",
                        "HTMLEmbedElement.prototype.getSVGDocument",
                    ]);
                })
                .then(() => utils.promiseTemplateSave(driverRef))
                .then(() => promiseGetCurrentTemplateDescription(driverRef))
                .then(templateDesc => {
                    assert.equal(
                        templateDesc,
                        "The current template blocks 18 features and 3 standards.",
                        "Template description should indiciate two blocked features."
                    );
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });

        it("Template display should be correct after refreshing page (issue #77)", function (done) {
            let driverRef;
            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => promiseGetCurrentTemplateDescription(driverRef))
                .then(templateDesc => {
                    assert.equal(
                        templateDesc,
                        "The current template blocks 0 features and 0 standards.",
                        "Initially no features or standards should be in the template rule."
                    );
                    return utils.promiseSetBlockedStandards(driverRef, [1, 2, 3]);
                })
                .then(() => utils.promiseTemplateSave(driverRef))
                .then(() => promiseGetCurrentTemplateDescription(driverRef))
                .then(templateDesc => {
                    assert.equal(
                        templateDesc,
                        "The current template blocks 16 features and 3 standards.",
                        "Template description should indicate three new blocked standards."
                    );
                    // Force page reload.
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => promiseGetCurrentTemplateDescription(driverRef))
                .then(templateDesc => {
                    assert.equal(
                        templateDesc,
                        "The current template blocks 16 features and 3 standards.",
                        "Template description should indicate three new blocked standards."
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

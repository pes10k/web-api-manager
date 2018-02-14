/**
 * These tests ensure that the listing of blocking rules in the config
 * page work as expected.  The code being targeted is, for the most part,
 * in the add-on/config/js/vue_components/blocking-rules.vue.js file.
 */
"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const ruleEditingUtils = require("./lib/rule-editing");
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

    describe("Changing patterns for existing rules", function () {
        this.timeout = () => 20000;

        it("Visibility of 'Edit' button", function (done) {
            const newRulePattern = "example.org";
            let driverRef;
            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => ruleEditingUtils.promiseGetPatternEditButton(driverRef))
                .then(possibleButton => {
                    assert.equal(
                        possibleButton,
                        undefined,
                        "There should be no 'Edit' button visible initially."
                    );
                    return utils.promiseCreateBlockRule(driverRef, newRulePattern);
                })
                .then(() => utils.promiseSelectBlockRule(driverRef, newRulePattern))
                .then(() => ruleEditingUtils.promiseGetPatternEditButton(driverRef))
                .then(possibleButton => {
                    assert.equal(
                        possibleButton === undefined,
                        false,
                        "The 'Edit' button should be visible when selecting the new rule."
                    );
                    return utils.promiseSelectBlockRule(driverRef, defaultPattern);
                })
                .then(() => ruleEditingUtils.promiseGetPatternEditButton(driverRef))
                .then(possibleButton => {
                    assert.equal(
                        possibleButton,
                        undefined,
                        "The 'Edit' button should not be visible after reselecting the default rule."
                    );
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });

        it("Changing 'example.org' to 'example.com'", function (done) {
            let driverRef;
            const firstStdIdsToBlock = [1, 2, 3];
            const secondStdIdsToBlock = [4, 5];
            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseCreateBlockRule(driverRef, "example.org"))
                .then(() => utils.promiseGetBlockedStandards(driverRef))
                .then(blockedStandards => {
                    assert.equal(
                        blockedStandards.length,
                        0,
                        "'example.org' should initially have no standards blocked."
                    );
                })
                .then(() => utils.promiseCreateBlockRule(driverRef, "other-example.org"))
                .then(() => utils.promiseGetBlockedStandards(driverRef))
                .then(blockedStandards => {
                    assert.equal(
                        blockedStandards.length,
                        0,
                        "'other-example.org' should also initially have no standards blocked."
                    );
                })
                .then(() => utils.promiseSetBlockedStandards(driverRef, secondStdIdsToBlock))
                .then(() => utils.promiseGetBlockedStandards(driverRef))
                .then(blockedStandards => {
                    assert.equal(
                        JSON.stringify(blockedStandards.sort()),
                        JSON.stringify(secondStdIdsToBlock),
                        "'other-example.org' should now have two standards blocked."
                    );
                })
                .then(() => utils.promiseSelectBlockRule(driverRef, "example.org"))
                .then(() => utils.promiseSetBlockedStandards(driverRef, firstStdIdsToBlock))
                .then(() => utils.promiseGetBlockedStandards(driverRef))
                .then(blockedStandards => {
                    assert.equal(
                        JSON.stringify(blockedStandards.sort()),
                        JSON.stringify(firstStdIdsToBlock),
                        "'example.org' should have three standards blocked."
                    );
                })
                .then(() => ruleEditingUtils.promiseGetPatternEditButton(driverRef))
                .then(editButton => editButton.click())
                .then(() => utils.pause(250))
                .then(() => ruleEditingUtils.promiseSetPatternInput(driverRef, "example.net"))
                .then(() => utils.pause(250))
                .then(() => ruleEditingUtils.promiseGetPatternSaveButton(driverRef))
                .then(saveButton => saveButton.click())
                .then(() => utils.promiseSelectBlockRule(driverRef, "other-example.org"))
                .then(() => utils.promiseGetBlockedStandards(driverRef))
                .then(blockedStandards => {
                    assert.equal(
                        JSON.stringify(blockedStandards.sort()),
                        JSON.stringify(secondStdIdsToBlock),
                        "'other-example.org' should still have two standards blocked."
                    );
                })
                .then(() => utils.promiseSelectBlockRule(driverRef, "example.net"))
                .then(() => utils.promiseGetBlockedStandards(driverRef))
                .then(blockedStandards => {
                    assert.equal(
                        JSON.stringify(blockedStandards.sort()),
                        JSON.stringify(firstStdIdsToBlock),
                        "'example.net' should have the three standards blocked that were set for 'example.org'."
                    );
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });

        it("Changing rules with the edit field open", function (done) {
            let driverRef;
            const firstStdIdsToBlock = [1, 2, 3];
            const secondStdIdsToBlock = [4, 5];
            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseCreateBlockRule(driverRef, "example.org"))
                .then(() => utils.promiseSetBlockedStandards(driverRef, firstStdIdsToBlock))
                .then(() => utils.promiseCreateBlockRule(driverRef, "other-example.org"))
                .then(() => utils.promiseSetBlockedStandards(driverRef, secondStdIdsToBlock))
                .then(() => ruleEditingUtils.promiseGetPatternEditButton(driverRef))
                .then(editButton => editButton.click())
                .then(() => utils.pause(250))
                .then(() => ruleEditingUtils.promiseGetPatternInputValue(driverRef))
                .then(inputText => {
                    assert.equal(
                        inputText,
                        "other-example.org",
                        "Edit pattern field should contain the selected block rule."
                    );
                    return utils.promiseSelectBlockRule(driverRef, "example.org");
                })
                .then(() => ruleEditingUtils.promiseGetPatternInputValue(driverRef))
                .then(inputText => {
                    assert.equal(
                        inputText,
                        undefined,
                        "The input field should be hidden when changing blocking rules."
                    );
                    return ruleEditingUtils.promiseGetPatternEditButton(driverRef);
                })
                .then(editButton => editButton.click())
                .then(() => utils.pause(250))
                .then(() => ruleEditingUtils.promiseGetPatternInputValue(driverRef))
                .then(inputText => {
                    assert.equal(
                        inputText,
                        "example.org",
                        "The edit field should be updated with the value of the new blocking rule."
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

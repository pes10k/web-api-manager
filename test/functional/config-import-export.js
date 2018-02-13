"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const webdriver = require("selenium-webdriver");
const by = webdriver.By;
const until = webdriver.until;

const beaconId = 4;
const svgId = 63;
const ambientLightSensorId = 2;
const webGLId = 73;

const emptyRuleSet = `[{"p":"(default)","s":[],"f":[]}]`;
const blockingSVGandBeacon = `[{"p":"(default)","s":[${beaconId},${svgId}],"f":[]}]`;
const newDomainImport = `[{"p":"*.example.com","s":[${ambientLightSensorId},${webGLId}],"f":[]}]`;

const promiseOpenImportExportTab = function (driver) {
    return utils.promiseExtensionConfigPage(driver)
        .then(() => driver.wait(until.elementLocated(by.css("a[href='#import-export']"))), 500)
        .then(element => element.click());
};

describe("Config panel: Import / Export", function () {
    this.timeout = () => 20000;

    describe("Exporting", function () {
        it("Exporting empty blocking rule", function (done) {
            let driverRef;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => promiseOpenImportExportTab(driverRef))
                .then(() => driverRef.findElement(by.css(".export-section select option:nth-child(1)")).click())
                .then(() => driverRef.findElement(by.css(".export-section textarea")).getAttribute("value"))
                .then(exportValue => {
                    driverRef.quit();
                    assert.equal(exportValue.trim(), emptyRuleSet, "Exported ruleset does not match expected value.");
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });

        it("Exporting SVG and Beacon blocking rules", function (done) {
            let driverRef;

            const svgAndBeconIds = utils.constants.svgBlockRule.concat([beaconId]);

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => utils.promiseSetBlockedStandards(driverRef, svgAndBeconIds))
                .then(() => promiseOpenImportExportTab(driverRef))
                .then(() => driverRef.findElement(by.css(".export-section select option:nth-child(1)")).click())
                .then(() => driverRef.findElement(by.css(".export-section textarea")).getAttribute("value"))
                .then(exportValue => {
                    assert.equal(exportValue.trim(), blockingSVGandBeacon, "Exported ruleset does not match expected value.");
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });
    });

    describe("Importing", function () {
        it("Importing SVG and Beacon blocking rules", function (done) {
            let driverRef;
            let checkedCheckboxes;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => promiseOpenImportExportTab(driverRef))
                .then(() => driverRef.findElement(by.css(".import-section textarea")).sendKeys(blockingSVGandBeacon))
                .then(() => driverRef.findElement(by.css(".import-section input[type='checkbox']")).click())
                .then(() => driverRef.findElement(by.css(".import-section button")).click())
                .then(() => utils.pause(500))
                .then(() => driverRef.findElements(by.css("#blocking-rules input[type='checkbox']:checked")))
                .then(checkboxElms => {
                    checkedCheckboxes = checkboxElms;
                    assert.equal(checkboxElms.length, 2, "There should be two standards blocked.");
                    return checkedCheckboxes[1].getAttribute("value");
                })
                .then(firstCheckboxValue => {
                    assert.equal(firstCheckboxValue, beaconId, "One blocked standard should be 'Beacon'.");
                    return checkedCheckboxes[0].getAttribute("value");
                })
                .then(secondCheckboxValue => {
                    assert.equal(secondCheckboxValue, utils.constants.svgBlockRule[0], "The other blocked standard should be SVG.");
                    driverRef.quit();
                    done();
                })
                .catch(e => {
                    driverRef.quit();
                    done(e);
                });
        });

        it("Importing rules for new domain", function (done) {
            let driverRef;
            let checkedCheckboxes;

            utils.promiseGetDriver()
                .then(driver => {
                    driverRef = driver;
                    return utils.promiseExtensionConfigPage(driverRef);
                })
                .then(() => promiseOpenImportExportTab(driverRef))
                .then(() => driverRef.findElement(by.css(".import-section textarea")).sendKeys(newDomainImport))
                .then(() => driverRef.findElement(by.css(".import-section button")).click())
                .then(() => utils.pause(500))
                .then(() => driverRef.findElement(by.css("a[href='#blocking-rules']")).click())
                .then(() => driverRef.findElements(by.css("#blocking-rules .patterns-container input[type='radio']")))
                .then(radioElms => {
                    assert.equal(radioElms.length, 2, "There should be two domain rules in place.");
                    return radioElms[0].click();
                })
                .then(() => driverRef.findElements(by.css("#blocking-rules input[type='checkbox']:checked")))
                .then(checkboxElms => {
                    checkedCheckboxes = checkboxElms;
                    assert.equal(checkboxElms.length, 2, "There should be two standards blocked.");
                    return checkedCheckboxes[1].getAttribute("value");
                })
                .then(firstCheckboxValue => {
                    assert.equal(firstCheckboxValue, ambientLightSensorId, "One blocked standard should be 'Ambient Light Sensor API'.");
                    return checkedCheckboxes[0].getAttribute("value");
                })
                .then(secondCheckboxValue => {
                    assert.equal(secondCheckboxValue, webGLId, "The other blocked standard should be 'WebGL Specification'.");
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

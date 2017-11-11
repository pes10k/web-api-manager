"use strict";

const assert = require("assert");
const utils = require("./lib/utils");
const webdriver = require("selenium-webdriver");
const by = webdriver.By;
const until = webdriver.until;

const emptyRuleSet = "[{\"pattern\":\"(default)\",\"standards\":[]}]";
const blockingSVGandBeacon = "[{\"pattern\":\"(default)\",\"standards\":[\"Beacon\",\"Scalable Vector Graphics (SVG) 1.1 (Second Edition)\"]}]";
const newDomainImport = "[{\"pattern\":\"*.example.com\",\"standards\":[\"Ambient Light Sensor API\",\"WebGL Specification\"]}]";

const promiseOpenImportExportTab = function (driver) {

    return utils.promiseExtensionConfigPage(driver)
        .then(() => driver.wait(until.elementLocated(by.css("a[href='#import-export']"))), 500)
        .then(element => element.click());
};

describe("Import / Export", function () {

    this.timeout = () => 20000;

    describe("Exporting", function () {

        it("Exporting empty blocking rule", function (done) {

            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return promiseOpenImportExportTab(driverReference);
                })
                .then(() => driverReference.findElement(by.css(".export-section select option:nth-child(1)")).click())
                .then(() => driverReference.findElement(by.css(".export-section textarea")).getAttribute("value"))
                .then(function (exportValue) {
                    driverReference.quit();
                    assert.equal(exportValue.trim(), emptyRuleSet, "Exported ruleset does not match expected value.");
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    done(e);
                });
        });

        it("Exporting SVG and Beacon blocking rules", function (done) {

            let driverReference;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return utils.promiseSetBlockingRules(driverReference, utils.constants.svgBlockRule.concat(["Beacon"]));
                })
                .then(() => promiseOpenImportExportTab(driverReference))
                .then(() => driverReference.findElement(by.css(".export-section select option:nth-child(1)")).click())
                .then(() => driverReference.findElement(by.css(".export-section textarea")).getAttribute("value"))
                .then(function (exportValue) {
                    assert.equal(exportValue.trim(), blockingSVGandBeacon, "Exported ruleset does not match expected value.");
                    driverReference.quit();
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    done(e);
                });
        });
    });

    describe("Importing", function () {

        it("Importing SVG and Beacon blocking rules", function (done) {

            let driverReference;
            let checkedCheckboxes;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return promiseOpenImportExportTab(driverReference);
                })
                .then(() => driverReference.findElement(by.css(".import-section textarea")).sendKeys(blockingSVGandBeacon))
                .then(() => driverReference.findElement(by.css(".import-section input[type='checkbox']")).click())
                .then(() => driverReference.findElement(by.css(".import-section button")).click())
                .then(() => utils.pause(500))
                .then(() => driverReference.findElements(by.css("#domain-rules input[type='checkbox']:checked")))
                .then(function (checkboxElms) {
                    checkedCheckboxes = checkboxElms;
                    assert.equal(checkboxElms.length, 2, "There should be two standards blocked.");
                    return checkedCheckboxes[0].getAttribute("value");
                })
                .then(function (firstCheckboxValue) {
                    assert.equal(firstCheckboxValue, "Beacon", "The first blocked standard should be 'Beacon'.");
                    return checkedCheckboxes[1].getAttribute("value");
                })
                .then(function (secondCheckboxValue) {
                    assert.equal(secondCheckboxValue, utils.constants.svgBlockRule[0], "The second blocked standard should be the SVG standard.");
                    driverReference.quit();
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    done(e);
                });
        });

        it("Importing rules for new domain", function (done) {

            let driverReference;
            let checkedCheckboxes;

            utils.promiseGetDriver()
                .then(function (driver) {
                    driverReference = driver;
                    return promiseOpenImportExportTab(driverReference);
                })
                .then(() => driverReference.findElement(by.css(".import-section textarea")).sendKeys(newDomainImport))
                .then(() => driverReference.findElement(by.css(".import-section button")).click())
                .then(() => utils.pause(500))
                .then(() => driverReference.findElement(by.css("a[href='#domain-rules']")).click())
                .then(() => driverReference.findElements(by.css("#domain-rules input[type='radio']")))
                .then(function (radioElms) {
                    assert.equal(radioElms.length, 2, "There should be two domain rules in place.");
                    return radioElms[0].click();
                })
                .then(() => driverReference.findElements(by.css("#domain-rules input[type='checkbox']:checked")))
                .then(function (checkboxElms) {
                    checkedCheckboxes = checkboxElms;
                    assert.equal(checkboxElms.length, 2, "There should be two standards blocked.");
                    return checkedCheckboxes[0].getAttribute("value");
                })
                .then(function (firstCheckboxValue) {
                    assert.equal(firstCheckboxValue, "Ambient Light Sensor API", "The first blocked standard should be 'Ambient Light Sensor API'.");
                    return checkedCheckboxes[1].getAttribute("value");
                })
                .then(function (secondCheckboxValue) {
                    assert.equal(secondCheckboxValue, "WebGL Specification", "The second blocked standard should be 'WebGL Specification'.");
                    driverReference.quit();
                    done();
                })
                .catch(function (e) {
                    driverReference.quit();
                    done(e);
                });
        });
    });
});

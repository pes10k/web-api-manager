/**
 * Tests to ensure that the tools that are used to manage the state
 * of the extension perform as expected..
 *
 * The code being tested here mostly lives in (from the project root)
 * add-on/config/js/state.js
 */
"use strict";

const assert = require("assert");
const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");
const addonConfigLibPath = path.join(__dirname, "..", "..", "add-on", "config", "js");

// These will end up not returing anything, but will instead populate
// window.WEB_API_MANAGER
require(path.join(addonLibPath, "init.js"));
require(path.join(addonConfigLibPath, "state.js"));
const stateLib = window.WEB_API_MANAGER.stateLib;

describe("Extension State Management", function () {
    describe("Array comparisons", function () {
        it("Identical values in same order", function (done) {
            const firstArray = [1, 2, 3, "A", "B", "C"];
            const secondArray = [1, 2, 3, "A", "B", "C"];
            const areEqual = stateLib.areArrayValuesIdentical(firstArray, secondArray);

            assert.equal(areEqual, true, "Arrays contain identical values, so should evaluate to identical.");
            done();
        });

        it("Identical values in different order", function (done) {
            const firstArray = [1, 2, 3, "A", "B", "C"];
            const secondArray = [1, "B", 2, "A", 3, "C"];
            const areEqual = stateLib.areArrayValuesIdentical(firstArray, secondArray);

            assert.equal(areEqual, true, "Arrays contain identical values, so should evaluate to identical.");
            done();
        });

        it("Different values", function (done) {
            const firstArray = [1, 2, 3, "A", "B", "C"];
            const secondArray = ["Totally", "different", "values"];
            const areEqual = stateLib.areArrayValuesIdentical(firstArray, secondArray);

            assert.equal(areEqual, false, "Arrays contain different values, so should evaluate to not identical.");
            done();
        });
    });

    describe("Domain rule comparisons", function () {
        it("Identical rule sets: same order", function (done) {
            const firstRuleSet = {
                "(default)": [],
                "www.example.com": ["Beacon", "Vibrate API"],
            };

            const secondRuleSet = {
                "(default)": [],
                "www.example.com": ["Beacon", "Vibrate API"],
            };

            const areEqual = stateLib.areRuleSetsIdentical(firstRuleSet, secondRuleSet);
            assert.equal(areEqual, false, "Both rule sets block the same standards on the same domains.");
            done();
        });

        it("Identical rule sets: different orders", function (done) {
            const firstRuleSet = {
                "(default)": [],
                "www.example.com": ["Beacon", "Vibrate API"],
            };

            const secondRuleSet = {
                "www.example.com": ["Vibrate API", "Beacon"],
                "(default)": [],
            };

            const areEqual = stateLib.areRuleSetsIdentical(firstRuleSet, secondRuleSet);
            assert.equal(areEqual, false, "Both rule sets block the same standards on the same domains.");
            done();
        });

        it("Different rule sets: different domains", function (done) {
            const firstRuleSet = {
                "(default)": [],
                "www.example.com": ["Beacon", "Vibrate API"],
            };

            const secondRuleSet = {
                "(default)": [],
                "www.example.net": ["Beacon", "Vibrate API"],
            };

            const areEqual = stateLib.areRuleSetsIdentical(firstRuleSet, secondRuleSet);
            assert.equal(areEqual, false, "The domains being described by these rule sets are different.");
            done();
        });

        it("Different rule sets: different standards", function (done) {
            const firstRuleSet = {
                "(default)": [],
                "www.example.com": ["Beacon", "Vibrate API"],
            };

            const secondRuleSet = {
                "(default)": [],
                "www.example.com": ["Beacon", "Gamepad API"],
            };

            const areEqual = stateLib.areRuleSetsIdentical(firstRuleSet, secondRuleSet);
            assert.equal(areEqual, false, "The standards blocked by the rule sets are different.");
            done();
        });
    });
});

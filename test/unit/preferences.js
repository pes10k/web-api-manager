/**
 * Tests to ensure that basic operations against the preferences library
 * work as expected.
 *
 * The code being tested here mostly lives in (from the project root)
 * add-on/lib/preferences.js
 */
"use strict";

const assert = require("assert");
const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");

// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
require(path.join(addonLibPath, "browser.js"));
require(path.join(addonLibPath, "blockrules.js"));
require(path.join(addonLibPath, "preferences.js"));
const {preferencesLib, enums, blockRulesLib, constants} = window.WEB_API_MANAGER;

const areArraysEqual = (arrayOne, arrayTwo) => {
    if (arrayOne.length !== arrayTwo.length) {
        return false;
    }
    return arrayOne.every(value => arrayTwo.includes(value));
};

describe("Preferences management", function () {
    describe("CRUD operations", function () {
        it("Initilize empty preferences", function (done) {
            const prefs = preferencesLib.initNew();
            const numRules = prefs.getAllRules().length;
            assert.equal(numRules, 1, "New preferences should have default rule.");

            const shouldLog = prefs.getShouldLog();
            assert.equal(
                shouldLog,
                enums.ShouldLogVal.NONE,
                "By default, preferences should be set to not log."
            );
            done();
        });

        it("Default rule", function (done) {
            const prefs = preferencesLib.initNew();
            const defaultRule = prefs.getDefaultRule();
            assert.equal(defaultRule.getPattern(), constants.defaultPattern, "getDefaultRule should return default pattern.");

            assert.equal(defaultRule.getStandardIds().length, 0, "Default rule should initially not block any standards.");
            done();
        });

        it("Adding a rule", function (done) {
            const prefs = preferencesLib.initNew();
            const testPattern = "www.example.com";
            const testStandardIds = [1, 2, 3];
            const blockRule = blockRulesLib.init(testPattern, testStandardIds);

            prefs.addRule(blockRule);

            const numRulesPostAdd = prefs.getAllRules().length;
            assert.equal(numRulesPostAdd, 2, "Preferences should have two rules, default rule and added rule.");

            const newRule = prefs.getNonDefaultRules()[0];
            assert.equal(newRule.getPattern(), testPattern, "Pattern on rule should match created rule's pattern.");

            const areStandardIdsEqual = areArraysEqual(newRule.getStandardIds(), testStandardIds);
            assert.equal(areStandardIdsEqual, true, "Standard ids on rule should match created rule's ids.");
            done();
        });

        it("Deleting a rule", function (done) {
            const prefs = preferencesLib.initNew();
            const testPattern = "www.example.com";
            const testStandardIds = [1, 2, 3];
            const blockRule = blockRulesLib.init(testPattern, testStandardIds);

            const wasDeletedPre = prefs.deleteRuleForPattern(testPattern);
            assert.equal(wasDeletedPre, false, "Attempting to delete a rule that does not exist should return false.");

            prefs.addRule(blockRule);
            const nonDefaultRulesPreDelete = prefs.getNonDefaultRules();
            assert.equal(nonDefaultRulesPreDelete.length, 1, "There should be one non-default rules after adding.");

            const wasDeletedPost = prefs.deleteRuleForPattern(testPattern);
            assert.equal(wasDeletedPost, true, "Attempting to delete a rule that does exist should return true.");

            const nonDefaultRulesPostDelete = prefs.getNonDefaultRules();
            assert.equal(nonDefaultRulesPostDelete.length, 0, "There should be no non-default rules still in the system.");
            done();
        });

        it("Updating an existing rule", function (done) {
            const prefs = preferencesLib.initNew();
            const preDefaultRule = prefs.getDefaultRule();

            const standardIdsForDefaultRuleStart = preDefaultRule.getStandardIds();
            assert.equal(areArraysEqual(standardIdsForDefaultRuleStart, []), true, "By default, standard rule should block no standards.");

            const updateStandardIds = [1, 2, 3];
            prefs.upcertRuleStandardIds(preDefaultRule.getPattern(), updateStandardIds);
            const postDefaultRule = prefs.getDefaultRule();
            const postStandardIds = postDefaultRule.getStandardIds();
            assert.equal(areArraysEqual(postStandardIds, updateStandardIds), true, "After upcert, the default rule should reflect new standards.");
            done();
        });
    });

    describe("Serializing and deserializing", function () {
        it("Handling incorrect JSON", function (done) {
            const badJSON = JSON.stringify({prop: "nonsense", data: "other"});

            try {
                preferencesLib.fromJSON(badJSON);
                done(new Error("No exception thrown for bad JSON."));
            } catch (e) {
                done();
            }
        });

        it("Encoding to and from JSON", function (done) {
            const prefs = preferencesLib.initNew();
            const testDefaultStdIds = [1, 2, 3];
            prefs.upcertRuleStandardIds(constants.defaultPattern, testDefaultStdIds);

            const testNewPattern = "www.example.com";
            const testNewRuleStdIds = [4, 5, 6];
            const newTestRule = blockRulesLib.init(testNewPattern, testNewRuleStdIds);
            prefs.addRule(newTestRule);

            const prefsJSON = prefs.toJSON();
            const newPrefs = preferencesLib.fromJSON(prefsJSON);
            const postStdIds = newPrefs.getDefaultRule().getStandardIds();
            const areDefaultIdsMatching = areArraysEqual(postStdIds, testDefaultStdIds);
            assert.equal(areDefaultIdsMatching, true, "Deserialized preferences should include serialized default standard ids.");

            const postNonDefaultRules = newPrefs.getNonDefaultRules();
            assert.equal(postNonDefaultRules.length, 1, "Deserailized preferences should have one non-default rule");

            const postNonDefaultRule = postNonDefaultRules[0];
            assert.equal(postNonDefaultRule.getPattern(), testNewPattern, "Deserialized non-default rule should match serialized pattern.");

            const postNonDefaultStdIds = postNonDefaultRule.getStandardIds();
            const arePostStdIdsMatching = areArraysEqual(postNonDefaultStdIds, testNewRuleStdIds);
            assert.equal(arePostStdIdsMatching, true, "Deserialized non-default rule shold match serialized standard ids.");
            done();
        });
    });
});

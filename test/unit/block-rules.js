/**
 * Tests to ensure that the pattern matching code (what determins which
 * standard blocking rules should be applied to which domain) is correct.
 *
 * The code being tested here mostly lives in (from the project root)
 * add-on/lib/blockrules.js
 */
"use strict";

const assert = require("assert");
const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");

// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
require(path.join(addonLibPath, "blockrules.js"));
const {blockRulesLib} = window.WEB_API_MANAGER;

describe("Block rules managing", function () {
    const testPatterns = [
        "*.example.com",
        "www.uic.edu",
        "cs.uic.edu",
    ];

    const testRules = testPatterns.map(pattern => blockRulesLib.init(pattern, []));
    const findMatchingRule = host => testRules.find(rule => rule.isMatchingHost(host));

    describe("Host matching", function () {
        describe("Exact matches", function () {
            it("Positive: input 'www.uic.edu' gives pattern 'www.uic.edu'", function (done) {
                const testHost = "www.uic.edu";
                const matchingRule = findMatchingRule(testHost);
                assert.equal(matchingRule.getPattern(), "www.uic.edu");
                done();
            });

            it("Negative: input 'nope.uic.edu' gives no pattern", function (done) {
                const testHost = "nope.uic.edu";
                const matchingRule = findMatchingRule(testHost);
                assert.equal(matchingRule, undefined);
                done();
            });
        });

        describe("Wildcard matches", function () {
            it("Positive: input 'www.example.com' gives pattern '*.example.com'", function (done) {
                const testHost = "www.example.com";
                const matchingRule = findMatchingRule(testHost);
                assert.equal(matchingRule.getPattern(), "*.example.com");
                done();
            });

            it("Negative: input 'www.example.com.co.uk' gives no pattern", function (done) {
                const testHost = "www.example.com.co.uk";
                const matchingRule = findMatchingRule(testHost);
                assert.equal(matchingRule, undefined);
                done();
            });
        });

        describe("Collapsed matches", function () {
            it("Positive: input 'example.com' gives pattern '*.example.com'", function (done) {
                const testHost = "example.com";
                const matchingRule = findMatchingRule(testHost);
                assert.equal(matchingRule.getPattern(), "*.example.com");
                done();
            });
        });
    });
});

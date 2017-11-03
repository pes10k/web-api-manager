/**
 * Tests to ensure that the pattern matching code (what determins which
 * standard blocking rules should be applied to which domain) is correct.
 * 
 * The code being tested here mostly lives in (from the project root)
 * add-on/lib/domainmatcher.js
 */
"use strict";

const assert = require("assert");
const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");

// These will end up not returing anything, but will instead populate
// window.WEB_API_MANAGER
require(path.join(addonLibPath, "init.js"));
require(path.join(addonLibPath, "domainmatcher.js"));
const domainMatcherLib = window.WEB_API_MANAGER.domainMatcherLib;

describe("Host Pattern Matching", function () {

    const testPatterns = [
        "*.example.com",
        "www.uic.edu",
        "cs.uic.edu",
    ];

    describe("Exact matches", function () {

        it("Positive case: input 'www.uic.edu' gives pattern 'www.uic.edu'", function (done) {

            const testHostName = "www.uic.edu";
            const matchingPattern = domainMatcherLib.matchHostName(testPatterns, testHostName);
            assert.equal(matchingPattern, "www.uic.edu");
            done();
        });

        it("Negative case: input 'nope.uic.edu' gives no pattern", function (done) {

            const testHostName = "nope.uic.edu";
            const matchingPattern = domainMatcherLib.matchHostName(testPatterns, testHostName);
            assert.equal(matchingPattern, undefined);
            done();
        });
    });

    describe("Wildcard matches", function () {

        it("Positive case: input 'www.example.com' gives pattern '*.example.com'", function (done) {

            const testHostName = "www.example.com";
            const matchingPattern = domainMatcherLib.matchHostName(testPatterns, testHostName);
            assert.equal(matchingPattern, "*.example.com");
            done();
        });

        it("Negative case: input 'www.example.com.co.uk' gives no pattern", function (done) {

            const testHostName = "www.example.com.co.uk";
            const matchingPattern = domainMatcherLib.matchHostName(testPatterns, testHostName);
            assert.equal(matchingPattern, undefined);
            done();
        });
    });

    describe("Collapsed matches", function () {

        it("Positive case: input 'example.com' gives pattern '*.example.com'", function (done) {
            const testHostName = "example.com";
            const matchingPattern = domainMatcherLib.matchHostName(testPatterns, testHostName);
            assert.equal(matchingPattern, "*.example.com");
            done();
        });
    });
});

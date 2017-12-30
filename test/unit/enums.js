/**
 * Tests to ensure that the extensions way of managing enums works correctly.
 *
 * The code being tested here mostly lives in (from the project root)
 * add-on/lib/init.js
 */
"use strict";

const assert = require("assert");
const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");

// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
const {enums} = window.WEB_API_MANAGER;

describe("Enums", function () {
    describe("Accessing", function () {
        it("Is write only", function (done) {
            const initialNoneVal = enums.ShouldLogVal.NONE;
            try {
                enums.ShouldLogVal.NONE = "something new";
                done(new Error("Trying to change enum values should throw."));
            } catch (ignore) {
                assert.equal(enums.ShouldLogVal.NONE, initialNoneVal, "Enum values are read-only.");
                done();
            }
        });

        it("Look ups work correctly", function (done) {
            assert.equal(enums.ShouldLogVal.NONE, "0", "Enum values work correctly as mappings to simpler values.");
            done();
        });
    });

    describe("Asserting enum correctness", function () {
        it("No exception thrown for value enum value", function (done) {
            enums.utils.assertValidEnum(enums.ShouldLogVal, enums.ShouldLogVal.NONE);
            done();
        });

        it("Exception thrown for invalid enum value", function (done) {
            try {
                enums.utils.assertValidEnum(enums.ShouldLogVal, "does not exist");
                done(new Error("An exception should have been trown when testing for an invalid enum value."));
            } catch (ignore) {
                done();
            }
        });
    });
});

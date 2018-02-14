/**
 * Tests to ensure that functionality for migrating stored versions of
 * blocking preferences is migrated between schemas correctly.
 *
 * The code being tested here mostly lives in (from the project root)
 * add-on/lib/migration.js
 */
"use strict";

const assert = require("assert");
const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "add-on", "lib");

// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
require(path.join(addonLibPath, "browser.js"));
require(path.join(addonLibPath, "standards.js"));
require(path.join(addonLibPath, "migration.js"));
require(path.join(addonLibPath, "preferences.js"));
const {migrationLib, preferencesLib, constants, enums} = window.WEB_API_MANAGER;

const validV1Data = {
    webApiManager: {
        shouldLog: true,
        domainRules: {
            "cs.uic.edu": [
                "Ambient Light Sensor API",
                "Scalable Vector Graphics (SVG) 1.1 (Second Edition)",
            ],
            "(default)": [
                "Gamepad",
                "Performance Timeline Level 2",
                "Vibration API",
            ],
        },
    },
};

const validV2Data = {
    webApiManager: {
        schema: 2,
        shouldLog: false,
        rules: [
            {
                p: "www.example.com",
                s: [1, 2, 3],
            },
            {
                p: "(default)",
                s: [4, 5, 6],
            },
        ],
    },
};

const validV3Data = {
    webApiManager: {
        schema: 3,
        shouldLog: enums.ShouldLogVal.NONE,
        rules: [
            {
                p: "www.example.com",
                s: [1, 2, 3],
            },
            {
                p: "(default)",
                s: [4, 5, 6],
            },
        ],
    },
};

const validV4Data = {
    webApiManager: {
        schema: 4,
        shouldLog: enums.ShouldLogVal.NONE,
        rules: [
            {
                p: "www.example.com",
                s: [1, 2, 3],
            },
            {
                p: "(default)",
                s: [4, 5, 6],
            },
        ],
        template: [7, 8, 9],
    },
};

const validV5Data = {
    webApiManager: {
        schema: 5,
        shouldLog: enums.ShouldLogVal.NONE,
        rules: [
            {
                p: "www.example.com",
                s: [1, 2, 3],
            },
            {
                p: "(default)",
                s: [4, 5, 6],
            },
        ],
        template: [7, 8, 9],
        blockCrossFrame : true,
    },
};

const validV6Data = {
    webApiManager: {
        schema: 6,
        shouldLog: enums.ShouldLogVal.NONE,
        rules: [
            {
                p: "www.example.com",
                s: [1, 2, 3],
                f: ["Performance.prototype.now"],
            },
            {
                p: "(default)",
                s: [4, 5, 6],
                f: ["HTMLCanvasElement.prototype.toBlob"],
            },
        ],
        template: {
            s: [7, 8, 9],
            f: ["Document.prototype.getElementsByClassName"],
        },
        blockCrossFrame : true,
    },
};

/**
 * Performs common asserts against preferences generated through the migrations.
 *
 * This is geneally meant to check empty migrations. Other expectatons can
 * be specified by setting the following properties in the `testExpections`
 * object.
 *   - shouldLog {string}: A {ShouldLogVal} enum value.
 *   - blockCrossFrame {boolean}
 *   - defaultRule {Array.<Array.number, Array.FeaturePath>}
 *      The expected results for the default blocking rule.  The first
 *      element is an array of standard ids, and the second value is an array
 *      of strings, describing paths to features that should be blocked.
 *   - otherRules {Object.<String, Array.<Array.number, Array.FeaturePath>>}
 *      An object describing the expected non-default rules.  The keys in
 *      the object should be the patterns for each blocking rule, and the
 *      values are arrays in the same format described in the `defaultRule`
 *      description above.
 *   - templateRule {Array.<Array.number, Array.FeaturePath>}
 *      An array describing the expected contents of the template rule,
 *      with the first value being an array of standard ids, and the second
 *      an array of strings describing paths to features that should be blocked.
 * @param {Preferences} prefs
 *   A preferences object, likely generated from migrated test preferences.
 * @param {?object} testExpections
 *   An optional object describing the expected responses from preference
 *   methods.
 *
 * @return {undefined}
 */
const assertMigratedPreferences = (prefs, testExpections = {}) => {
    const expectedShouldLog = (testExpections.shouldLog === undefined)
        ? enums.ShouldLogVal.NONE
        : testExpections.shouldLog;
    const foundShouldLog = prefs.getShouldLog();
    assert.equal(
        foundShouldLog,
        expectedShouldLog,
        "Unexpected \"should log\" value in migrated preferences."
    );

    const expectedBlockCrossFrame = (testExpections.blockCrossFrame === undefined)
        ? false
        : testExpections.blockCrossFrame;
    const foundBlockCrossFrame = prefs.getBlockCrossFrame();
    assert.equal(
        foundBlockCrossFrame,
        expectedBlockCrossFrame,
        "Unexpected \"should block cross frame\" value in migrated preferences."
    );

    const assertBlockingRuleEquals = (rule, ruleExpectations) => {
        const [expectedStdIds, expectedBlockedFeatures] = ruleExpectations;
        const foundStdIds = rule.getStandardIds();
        const foundBlockedFeatures = rule.getCustomBlockedFeatures();

        assert.equal(
            JSON.stringify(foundStdIds),
            JSON.stringify(expectedStdIds),
            `Unexpected standard ids for the '${rule.getPattern()}' rule in migrated preferences.`
        );
        assert.equal(
            JSON.stringify(foundBlockedFeatures),
            JSON.stringify(expectedBlockedFeatures),
            `Unexpected blocked features for the '${rule.getPattern()}' rule in migrated preferences.`
        );
    };

    const expectedDefaultRuleValues = (testExpections.defaultRule === undefined)
        ? [[], []]
        : testExpections.defaultRule;
    assertBlockingRuleEquals(prefs.getDefaultRule(), expectedDefaultRuleValues);

    if (testExpections.otherRules !== undefined) {
        Object.entries(testExpections.otherRules).forEach(([pattern, expectedValues]) => {
            const ruleForPattern = prefs.getRuleForPattern(pattern);
            assert.equal(
                typeof ruleForPattern,
                "object",
                `Could not find expected rule for '${pattern}' in the migrated preferences.`
            );
            assertBlockingRuleEquals(ruleForPattern, expectedValues);
        });
    } else  {
        assert.equal(
            prefs.getNonDefaultRules(),
            0,
            `There should be no non-default rules in this migration.`
        );
    }

    const expectedTemplateRuleValues = (testExpections.templateRule === undefined)
        ? [[], []]
        : testExpections.templateRule;
    assertBlockingRuleEquals(prefs.getTemplateRule(), expectedTemplateRuleValues);
};


describe("Migrations", function () {
    describe("Handling invalid data", function () {
        it("Invalid shaped object", function (done) {
            const testData = {
                badRules: [],
                somethingElse: false,
            };

            const [success, data] = migrationLib.applyMigrations(testData);

            assert.equal(success, false, "On invalid data, migration should return false.");
            assert.equal("string", typeof data, "On invalid data, should not return migration data.");
            done();
        });

        it("Storage object with invalid v1 properties", function (done) {
            const testData = {
                webApiManager: {
                    shouldLog: false,
                    domainRules: "some string, should be an object",
                },
            };

            const [success, data] = migrationLib.applyMigrations(testData);

            assert.equal(success, false, "On invalid data, migration should return false.");
            assert.equal("string", typeof data, "On invalid data, should not return migration data.");
            done();
        });

        it("V1 data with invalid standard", function (done) {
            const testData = {
                webApiManager: {
                    shouldLog: false,
                    domainRules: {
                        "www.example.com": [
                            "Ambient Light Sensor API",
                            "Scalable Vector Graphics (SVG) 1.1 (Second Edition)",
                            "not a real one",
                        ],
                    },
                },
            };

            const [success, data] = migrationLib.applyMigrations(testData);

            assert.equal(success, false, "On invalid data, migration should return false.");
            assert.equal("string", typeof data, "On invalid data, should not return migration data.");
            done();
        });
    });

    describe("Migrating v1 data", function () {
        it("With one blocking rule", function (done) {
            const v1data = {
                webApiManager: {
                    shouldLog: false,
                    domainRules: {
                        "www.example.com": [
                            "Ambient Light Sensor API",
                            "Scalable Vector Graphics (SVG) 1.1 (Second Edition)",
                        ],
                    },
                },
            };

            const [success, migratedData] = migrationLib.applyMigrations(v1data);

            assert.equal(success, true, "On valid data, migration should return true.");

            assert.equal(
                migratedData.webApiManager.shouldLog,
                enums.ShouldLogVal.NONE,
                "The false v1 `shouldLog` settings should be migrated to `none`."
            );

            assert.equal(
                migratedData.webApiManager.rules.length,
                Object.keys(v1data.webApiManager.domainRules).length,
                "All v1 rules should be migrated."
            );

            assert.equal(
                constants.schemaVersion,
                migratedData.webApiManager.schema,
                "Migrated schema should indicate its up to date."
            );

            assert.equal(
                0,
                migratedData.webApiManager.template.s.length,
                "Migrated schema should include an empty template rule, with no standards specified."
            );

            assert.equal(
                0,
                migratedData.webApiManager.template.f.length,
                "Migrated schema should include an empty template rule, with no features specified."
            );

            migratedData.webApiManager.rules.forEach(ruleData => {
                const rulePattern = ruleData.p;
                const priorRule = v1data.webApiManager.domainRules[rulePattern];

                assert.equal(
                    Array.isArray(priorRule),
                    true,
                    `Rule data should exist for ${rulePattern}`
                );

                assert.equal(
                    ruleData.s.length,
                    priorRule.length,
                    `The same number of standards should be blocked for ${rulePattern}`
                );
            });
            done();
        });

        it("With two blocking rules", function (done) {
            const [success, migratedData] = migrationLib.applyMigrations(validV1Data);

            assert.equal(success, true, "On valid data, migration should return true.");

            assert.equal(
                migratedData.webApiManager.shouldLog,
                enums.ShouldLogVal.STANDARD,
                "v1 true `shouldLog` setting should be migrated to `standard` string in v3."
            );

            assert.equal(
                constants.schemaVersion,
                migratedData.webApiManager.schema,
                "Migrated schema should indicate its up to date"
            );

            assert.equal(
                migratedData.webApiManager.rules.length,
                Object.keys(validV1Data.webApiManager.domainRules).length,
                "All v1 rules should be migrated."
            );

            migratedData.webApiManager.rules.forEach(ruleData => {
                const rulePattern = ruleData.p;
                const priorRule = validV1Data.webApiManager.domainRules[rulePattern];

                assert.equal(
                    Array.isArray(priorRule),
                    true,
                    `Rule data should exist for ${rulePattern}`
                );

                assert.equal(
                    ruleData.s.length,
                    priorRule.length,
                    `The same number of standards should be blocked for ${rulePattern}`
                );
            });
            done();
        });

        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV1Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));
            const expectedResults = {
                shouldLog: enums.ShouldLogVal.STANDARD,
                defaultRule: [[31, 55, 70], []],
                otherRules: {
                    "cs.uic.edu": [[2, 63], []],
                },
            };

            assertMigratedPreferences(prefs, expectedResults);
            done();
        });
    });

    describe("Handling v2 data", function () {
        it("Valid v2 data", function (done) {
            const [success, migratedData] = migrationLib.applyMigrations(validV2Data);
            assert.equal(success, true, "On valid data, migration should return true.");

            assert.equal(
                constants.schemaVersion,
                migratedData.webApiManager.schema,
                `Schema of migrated data should be ${constants.schemaVersion}`
            );

            assert.equal(
                enums.ShouldLogVal.NONE,
                migratedData.webApiManager.shouldLog,
                "false `shouldLog` value in v2 data should become `none`"
            );

            assert.equal(
                validV2Data.webApiManager.rules.length,
                migratedData.webApiManager.rules.length,
                "All rules should be migrated"
            );

            done();
        });

        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV2Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));
            const expectedResults = {
                defaultRule: [[4, 5, 6], []],
                otherRules: {
                    "www.example.com": [[1, 2, 3], []],
                },
            };

            assertMigratedPreferences(prefs, expectedResults);
            done();
        });
    });

    describe("Handling v3 data", function () {
        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV3Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));
            const expectedResults = {
                defaultRule: [[4, 5, 6], []],
                otherRules: {
                    "www.example.com": [[1, 2, 3], []],
                },
            };

            assertMigratedPreferences(prefs, expectedResults);
            done();
        });
    });

    describe("Handling v4 data", function () {
        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV4Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));
            const expectedResults = {
                defaultRule: [[4, 5, 6], []],
                otherRules: {
                    "www.example.com": [[1, 2, 3], []],
                },
                templateRule: [[7, 8, 9], []],
            };

            assertMigratedPreferences(prefs, expectedResults);
            done();
        });
    });

    describe("Handling v5 data", function () {
        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV5Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));
            const expectedResults = {
                otherRules: {
                    "www.example.com": [[1, 2, 3], []],
                },
                defaultRule: [[4, 5, 6], []],
                templateRule: [[7, 8, 9], []],
                blockCrossFrame: true,
            };

            assertMigratedPreferences(prefs, expectedResults);
            done();
        });
    });

    describe("Handling v6 data", function () {
        it("Empty data", function (done) {
            const testData = {};
            const [success, migratedData] = migrationLib.applyMigrations(testData);

            assert.equal(success, true, "On valid data, migration should return true.");
            assert.equal(0, Object.keys(migratedData).length, `On given an empty object, ${{}} should be returned}`);
            done();
        });

        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV6Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));
            const expectedResults = {
                defaultRule: [[4, 5, 6], ["HTMLCanvasElement.prototype.toBlob"]],
                otherRules: {
                    "www.example.com": [[1, 2, 3], ["Performance.prototype.now"]],
                },
                templateRule: [[7, 8, 9], ["Document.prototype.getElementsByClassName"]],
                blockCrossFrame: true,
            };

            assertMigratedPreferences(prefs, expectedResults);
            done();
        });
    });
});

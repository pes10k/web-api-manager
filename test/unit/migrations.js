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
                migratedData.webApiManager.template.length,
                "Migrated schema should include an empty template."
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

            assert.equal(
                enums.ShouldLogVal.STANDARD,
                prefs.getShouldLog(),
                "Should log setting should be correctly migrated from migrated data."
            );

            const prefRules = prefs.getAllRules();
            assert.equal(
                Object.keys(validV1Data.webApiManager.domainRules).length,
                prefRules.length,
                "Preferences should be populated with two blocking rules"
            );

            const defaultRule = prefs.getDefaultRule();
            assert.equal(
                JSON.stringify([31, 55, 70]),
                JSON.stringify(defaultRule.getStandardIds()),
                "All three standards for (default) should be migrated from v1 to v2"
            );

            const csUicRule = prefs.getRuleForPattern("cs.uic.edu");
            assert.equal(
                JSON.stringify([2, 63]),
                JSON.stringify(csUicRule.getStandardIds()),
                "Both standards for 'cs.uic.edu' should be migrated from v1 to v2"
            );

            assert.equal(
                false,
                prefs.getBlockCrossFrame(),
                "Migration from v1 data should result in not blocking cross frame acceess."
            );

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

            assert.equal(
                enums.ShouldLogVal.NONE,
                prefs.getShouldLog(),
                "Should log value should be correctly handled through v2 migration."
            );

            const defaultRule = prefs.getDefaultRule();
            assert.equal(
                JSON.stringify(validV2Data.webApiManager.rules[1].s),
                JSON.stringify(defaultRule.getStandardIds()),
                "Blocked standards for the default rule should be maintained through v2 migration."
            );

            const exampleRule = prefs.getRuleForPattern("www.example.com");
            assert.equal(
                JSON.stringify(validV2Data.webApiManager.rules[0].s),
                JSON.stringify(exampleRule.getStandardIds()),
                "Blocked standards for www.example.com rule should be maintained through v2 migration."
            );

            assert.equal(
                false,
                prefs.getBlockCrossFrame(),
                "Migration from v2 data should result in not blocking cross frame acceess."
            );

            done();
        });
    });

    describe("Handling v3 data", function () {
        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV3Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));

            assert.equal(
                enums.ShouldLogVal.NONE,
                prefs.getShouldLog(),
                "Should log value should be correctly handled through migration."
            );

            const defaultRule = prefs.getDefaultRule();
            assert.equal(
                JSON.stringify(validV3Data.webApiManager.rules[1].s),
                JSON.stringify(defaultRule.getStandardIds()),
                "Blocked standards for the default rule should be maintained through migration."
            );

            const exampleRule = prefs.getRuleForPattern("www.example.com");
            assert.equal(
                JSON.stringify(validV3Data.webApiManager.rules[0].s),
                JSON.stringify(exampleRule.getStandardIds()),
                "Blocked standards for www.example.com rule should be maintained through migration."
            );

            const template = prefs.getTemplate();
            assert.equal(
                0,
                template.length,
                "Migration from v3 data should result in an empty template."
            );

            assert.equal(
                false,
                prefs.getBlockCrossFrame(),
                "Migration from v4 data should result in not blocking cross frame acceess."
            );

            done();
        });
    });

    describe("Handling v4 data", function () {
        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV4Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));

            assert.equal(
                enums.ShouldLogVal.NONE,
                prefs.getShouldLog(),
                "Should log value should be correctly handled through migration."
            );

            const defaultRule = prefs.getDefaultRule();
            assert.equal(
                JSON.stringify(validV4Data.webApiManager.rules[1].s),
                JSON.stringify(defaultRule.getStandardIds()),
                "Blocked standards for the default rule should be maintained through migration."
            );

            const exampleRule = prefs.getRuleForPattern("www.example.com");
            assert.equal(
                JSON.stringify(validV4Data.webApiManager.rules[0].s),
                JSON.stringify(exampleRule.getStandardIds()),
                "Blocked standards for www.example.com rule should be maintained through migration."
            );

            const template = prefs.getTemplate();
            assert.equal(
                JSON.stringify(template.sort()),
                JSON.stringify(validV4Data.webApiManager.template),
                "Templates should be correctly stored through JSON translaiton."
            );

            assert.equal(
                false,
                prefs.getBlockCrossFrame(),
                "Migration from v4 data should result in not blocking cross frame acceess."
            );

            done();
        });
    });

    describe("Handling v5 data", function () {
        it("Empty data", function (done) {
            const testData = {};
            const [success, migratedData] = migrationLib.applyMigrations(testData);

            assert.equal(success, true, "On valid data, migration should return true.");
            assert.equal(0, Object.keys(migratedData).length, `On given an empty object, ${{}} should be returned}`);
            done();
        });

        it("Converting to preferences", function (done) {
            const [ignore, migratedData] = migrationLib.applyMigrations(validV5Data);
            const prefs = preferencesLib.fromJSON(JSON.stringify(migratedData.webApiManager));

            assert.equal(
                enums.ShouldLogVal.NONE,
                prefs.getShouldLog(),
                "Should log value should be correctly handled through migration."
            );

            const defaultRule = prefs.getDefaultRule();
            assert.equal(
                JSON.stringify(validV5Data.webApiManager.rules[1].s),
                JSON.stringify(defaultRule.getStandardIds()),
                "Blocked standards for the default rule should be maintained through migration."
            );

            const exampleRule = prefs.getRuleForPattern("www.example.com");
            assert.equal(
                JSON.stringify(validV5Data.webApiManager.rules[0].s),
                JSON.stringify(exampleRule.getStandardIds()),
                "Blocked standards for www.example.com rule should be maintained through migration."
            );

            const template = prefs.getTemplate();
            assert.equal(
                JSON.stringify(template.sort()),
                JSON.stringify(validV5Data.webApiManager.template),
                "Templates should be correctly stored through JSON translaiton."
            );

            assert.equal(
                true,
                prefs.getBlockCrossFrame(),
                "Migration from v5 data should result in blocking cross frame acceess."
            );

            done();
        });
    });
});

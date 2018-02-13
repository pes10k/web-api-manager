/**
 * This module handles automatically moving stored preferences in the format
 * that prior versions of the extension used, to the current version.
 */
(function () {
    "use strict";

    const {constants, enums, standardsLib} = window.WEB_API_MANAGER;
    const currentVersion = constants.schemaVersion;

    /**
     * Attempts to determine which version of the schema this extension data
     * was saved with.
     *
     * @param {object} data
     *   Persistent data loaded from the storage API in the extension.
     *
     * @return {number|false}
     *   Returns a number describing the used schema version, or false if
     *   the version could not be determined.
     */
    const guessDataVersion = data => {
        // If no data was provided, then treat it as matching the current
        // schema, since there is no data to migrate.
        if (!data || Object.values(data).length === 0) {
            return currentVersion;
        }

        try {
            // Preferences data of any version should all be nested in a
            // "webApiManager" property of an object.
            if (data.webApiManager === undefined) {
                return false;
            }

            // The initial version of the schema didn't use a version number,
            // so assume that if we received an object that doesn't have a
            // "schema" property, that its version 1.
            if (data.webApiManager.schema === undefined) {
                return 1;
            }

            // Small sanity check to make sure the data doesn't advertise
            // some version of the schema we don't understand.
            if (data.webApiManager.schema > currentVersion) {
                return false;
            }

            return data.webApiManager.schema;
        } catch (ignore) {
            // If we received something other than an object, or the
            // object is in an unexpected format, return false to indicate
            // we have no idea how to handle.
            return false;
        }
    };

    /**
     * Creates a new object, with the data stored in the version-1 schema
     * object, but in the format of the version-2 schema.
     *
     * @param {object} data
     *   Persistent data loaded from the storage API in the extension.
     *
     * @return {object}
     *   A new read only object, describing the same preferences, but in the
     *   schema 2 format.
     */
    const oneToTwo = data => {
        const migratedData = Object.create(null);
        migratedData.webApiManager = {};

        migratedData.webApiManager.shouldLog = data.webApiManager.shouldLog;
        migratedData.webApiManager.schema = 2;
        migratedData.webApiManager.rules = Object.entries(data.webApiManager.domainRules)
            .map(([matchPattern, stdIdStrs]) => {
                const stdIdNumbers = stdIdStrs.map(oldStdId => {
                    const intStdId = standardsLib.newIdForOldStandardId(oldStdId);
                    if (intStdId === undefined) {
                        throw `Unable to migrate standard id ${oldStdId}`;
                    }
                    return intStdId;
                });
                return Object.freeze({
                    p: matchPattern,
                    s: stdIdNumbers,
                });
            });

        Object.freeze(migratedData.webApiManager);
        return Object.freeze(migratedData);
    };

    /**
     * Creates a new object, with the settings stored in the given v-2
     * preferences data, but in the v-3 format.
     *
     * @param {object} data
     *   Persistent data loaded from the storage API in the extension.
     *
     * @return {object}
     *   A new read only object, describing the same preferences, but in the
     *   schema 3 format.
     */
    const twoToThree = data => {
        const migratedData = JSON.parse(JSON.stringify(data));

        migratedData.webApiManager.shouldLog = (data.webApiManager.shouldLog === true)
            ? enums.ShouldLogVal.STANDARD
            : enums.ShouldLogVal.NONE;

        migratedData.webApiManager.schema = 3;

        return Object.freeze(migratedData);
    };

    /**
     * Creates a new object, with the settings stored in the extensions version
     * 3 preferences, but updated to support the version 4 schema.
     *
     * In practice, this really just creates an empty array at
     * webApiManager.template.
     *
     * @param {object} data
     *   Persistent data loaded from the storage API in the extension.
     *
     * @return {object}
     *   A new read only object, describing the same preferences, but in the
     *   schema 4 format.
     */
    const threeToFour = data => {
        const migratedData = JSON.parse(JSON.stringify(data));
        migratedData.webApiManager.template = [];
        migratedData.webApiManager.schema = 4;
        return Object.freeze(migratedData);
    };

    /**
     * Creates a new object, with the settings stored in the extensions version
     * 4 preferences, but updated to support the version 5 schema.
     *
     * The only change this function makes is to add a blockCrossFrame
     * property, defaulting to `false`.
     *
     * @param {object} data
     *   Persistent data loaded from the storage API in the extension.
     *
     * @return {object}
     *   A new read only object, describing the same preferences, but in the
     *   schema 5 format.
     */
    const fourToFive = data => {
        const migratedData = JSON.parse(JSON.stringify(data));
        migratedData.webApiManager.schema = 5;
        migratedData.webApiManager.blockCrossFrame = false;
        return Object.freeze(migratedData);
    };

    /**
     * Creates a new object, with the settings stored in the extensions version
     * 5 preferences, but updated to support the version 6 schema.
     *
     * This function will add an empty "custom features" array too all the
     * blocking rules stored in the saved preferences data, and change the
     * template to contain both features and standards (to make it complete
     * feature blocking rule).
     *
     * @param {object} data
     *   Persistent data loaded from the storage API in the extension.
     *
     * @return {object}
     *   A new read only object, describing the same preferences, but in the
     *   schema 6 format.
     */
    const fiveToSix = data => {
        const migratedData = JSON.parse(JSON.stringify(data));
        migratedData.webApiManager.schema = 6;
        const rules = migratedData.webApiManager.rules;
        migratedData.webApiManager.rules = rules.map(aRule => {
            aRule.f = [];
            return aRule;
        });
        const priorTemplate = migratedData.webApiManager.template;
        migratedData.webApiManager.template = {
            s: priorTemplate,
            f: [],
        };
        return Object.freeze(migratedData);
    };

    /**
     * Apply any needed migrations to bring the structure of the given
     * stored preferences data to the current version.
     *
     * @param {?object} data
     *   Persistent data loaded from the storage API in the extension.
     *
     * @return {Array}
     *   An array of length two, the first a boolean if the migration process
     *   was successful (even if its a NOOP).  The second object is either
     *   the migrated data if successful, or a string describing the error
     *   if the data couldn't be migrated.
     */
    const applyMigrations = data => {
        const foundDataVersion = guessDataVersion(data);
        if (foundDataVersion === currentVersion) {
            return [true, data];
        }

        if (foundDataVersion === false) {
            return [false, `Unable to determine the version for ${JSON.stringify}`];
        }

        const migrations = [
            oneToTwo,
            twoToThree,
            threeToFour,
            fourToFive,
            fiveToSix,
        ];

        let currentMigratedVersion = foundDataVersion;
        let currentMigratedData = data;

        // Apply all needed migrations to the loaded preferences data,
        // updating by one version each step (ie 1->2, 2->3, etc).
        while (currentMigratedVersion < currentVersion) {
            try {
                const migrationFunc = migrations[currentMigratedVersion - 1];
                currentMigratedData = migrationFunc(currentMigratedData);
            } catch (e) {
                return [false, `Invalid data: v: ${currentMigratedVersion}, data ${JSON.stringify(currentMigratedData)}, e: ${e}`];
            }
            currentMigratedVersion += 1;
        }

        return [true, currentMigratedData];
    };

    window.WEB_API_MANAGER.migrationLib = {
        applyMigrations,
    };
}());

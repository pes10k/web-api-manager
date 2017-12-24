/**
 * Methods and state for tracking all user set preferences in the application.
 *
 * This module is effectivly methods for managing the singleton data, and for
 * syncronizing it with the database.
 */
(function () {
    "use strict";
    const {constants, browserLib, blockRulesLib, migrationLib} = window.WEB_API_MANAGER;
    const defaultPattern = constants.defaultPattern;
    const rootObject = browserLib.getRootObject();
    const storageKey = "webApiManager";

    /**
     * Represents and manages all of the user configuration in the extension.
     *
     * Manages the domains the user has set, which standards should be blocked
     * for each domain-matching rule, whether logging is enabled, etc.
     *
     * @typedef {object} Preferences
     * @param {function(): Array.BlockRule} getAllRules
     *   Returns an array of all the blocking rules configured in the system.
     * @param {function(): BlockRule} getDefaultRule
     *   Returns the block rule object that should be used if no other
     *   blocking rules match a given url.
     * @param {function(): Array.BlockRule} getNonDefaultRules
     *   Returns an array all user-set block rules in the system (e.g. every
     *   block rule that is not a default rule).
     * @param {function(string): BlockRule} getRuleForUrl
     *   Return the blocking rule that should be used for the given URL.
     * @param {function{MatchPattern}: ?BlockRule} getRuleForPattern
     *   Returns the blocking rule that describes what to block on the given
     *   pattern, or undefined if no such rule exists.
     * @param {function{BlockRule}: boolean} addRule
     *   Adds a blocking rule to the set of rules the user has set to block.
     *   This will not overwrite any rules, and returns false if there is
     *   already a rule in place for this pattern.  Otherwise returns true.
     * @param {function(MatchPattern): boolean} deleteRule
     *   Attempts to delete a blocking rule for the system, by looking to see
     *   if there is a BlockRule that matches the given pattern match.
     * @param {function(MatchPattern, Array.number): boolean} upcertRule
     *   Either updates the set of standards blocked for a given match
     *   pattern, or creates a new blocking rule.  Returns a boolean description
     *   of whether a new BlockRule object was created.
     * @param {function(boolean): undefined} setShouldLog
     *   Sets whether the system should log what functionality was blocked.
     * @param {function(): boolean} getShouldLog
     *   Returns whether the system is currently configured to log
     *   what standards / features are blocked.
     * @param {function(): object} toStorage
     *   Returns an encoding of the preferences object that can be saved
     *   using the storage API.
     * @param {function(): string} toJSON
     *   Returns a serialized version of the current state of user preferences,
     *   encoded as a JSON string. Used when sending user preferences to
     *   contexts across process boundaries or to other contexts where they
     *   should have read only access to user preferences.
     */

    /**
     *  Singleton, disk-sync'ed representation of the users preferences.
     * @param {?Preferences}
     */
    let instance;

    /**
     * Wraps a function, so that whenever the wrapped function returns,
     * the preferences object is resynced with the database.
     *
     * @param {function} func
     *   A function to wrap.
     *
     * @return {*}
     *   The same results as calling the provided function.
     */
    const resync = func => {
        return function () {
            const funcResult = func.apply(undefined, arguments);

            if (instance !== undefined) {
                const storageFormat = instance.toStorage();
                const storageObject = Object.create(null);
                storageObject[storageKey] = storageFormat;
                rootObject.storage.sync.set(storageObject);
            }

            return funcResult;
        };
    };

    const init = (blockRulesRaw = [], shouldLogRaw = false, syncWithDb = false) => {
        let shouldLogLocal = shouldLogRaw;

        let defaultRule;
        const nonDefaultRules = [];
        blockRulesRaw.map(blockRulesLib.fromData).forEach(rule => {
            if (rule.pattern === defaultPattern) {
                defaultRule = rule;
                return;
            }
            nonDefaultRules.push(rule);
        });

        // If the blocking rule was not in the set of rules loaded from
        // storage, then create a new, empty blocking rule for it.
        if (defaultRule === undefined) {
            defaultRule = blockRulesLib.init(defaultPattern, []);
        }

        // Create a map from the pattern for each blocking rule, to the
        // blocking rule itself.
        const patternsToRulesMap = nonDefaultRules
            .reduce((collection, rule) => {
                collection[rule.pattern] = rule;
                return collection;
            }, Object.create(null));

        const getAllRules = () => {
            const allRules = Object.values(patternsToRulesMap).concat([defaultRule]);
            return allRules;
        };

        const getRuleForUrl = url => {
            const matchingRule = Object.values(patternsToRulesMap)
                .find(br => br.isMatchingUrl(url));
            return matchingRule || defaultRule;
        };

        const getRuleForPattern = pattern => {
            if (pattern === defaultPattern) {
                return defaultRule;
            }
            return patternsToRulesMap[pattern];
        };

        const deleteRule = matchPattern => {
            if (patternsToRulesMap[matchPattern] === undefined) {
                return false;
            }

            delete patternsToRulesMap[matchPattern];
            return true;
        };

        const addRule = blockRule => {
            if (blockRule.pattern === constants.defaultPattern) {
                return false;
            }

            if (patternsToRulesMap[blockRule.pattern] !== undefined) {
                return false;
            }

            patternsToRulesMap[blockRule.pattern] = blockRule;
            return true;
        };

        const upcertRule = (pattern, standardIds) => {
            if (pattern === defaultPattern) {
                defaultRule.setStandardIds(standardIds);
                return false;
            }

            const isNewRule = patternsToRulesMap[pattern] === undefined;

            if (isNewRule) {
                addRule(blockRulesLib.init(pattern, standardIds));
            } else {
                const existingRule = patternsToRulesMap[pattern];
                existingRule.setStandardIds(standardIds);
            }

            return isNewRule;
        };

        const setShouldLog = newShouldLog => {
            shouldLogLocal = newShouldLog;
        };

        const getShouldLog = () => shouldLogLocal;

        const toStorage = () => {
            return {
                schema: constants.schemaVersion,
                rules: getAllRules().map(rule => rule.toData()),
                shouldLog: getShouldLog(),
            };
        };

        const toJSON = () => {
            const rulesData = getAllRules().map(rule => rule.toData());

            return JSON.stringify({
                rules: rulesData,
                shouldLog: getShouldLog(),
            });
        };

        const response = {
            getDefaultRule: () => defaultRule,
            getNonDefaultRules: () => Object.values(patternsToRulesMap),
            getRuleForPattern,
            getAllRules,
            getRuleForUrl,
            deleteRule,
            addRule,
            upcertRule,
            setShouldLog,
            getShouldLog,
            toStorage,
            toJSON,
        };

        if (syncWithDb === true) {
            const modifyingMethods = ["deleteRule", "addRule", "upcertRule", "setShouldLog"];
            modifyingMethods.forEach(methodName => {
                response[methodName] = resync(response[methodName]);
            });
        }

        Object.freeze(response);
        return response;
    };

    /**
     * Populates the user's preferences from permanant storage, and registers
     * that the instance returned from this call is the one "true"
     * representation of the preferences (e.g. the one that is kept in
     * sync with the database).
     *
     * This is distinct from the Preferences object returned from
     * the `preferencesLib.fromJSON`, which returns an identically interfaced
     * object, but which is not mirrored in storage.
     *
     * @param {?function} callback
     *   An optional callback function that, if provided, will be called with
     *   the loaded preferences object once its initilized from persistant
     *   storage.
     *
     * @return {undefined}
     */
    const load = callback => {
        const fromStorage = storedData => {
            console.log(storedData);
            const [success, migratedData] = migrationLib.applyMigrations(storedData);

            if (success !== true) {
                throw "Stored preferences did not match a known format";
            }

            let blockRulesRaw = [];
            let shouldLogRaw = false;

            if (migratedData &&
                    migratedData[storageKey] &&
                    migratedData[storageKey].rules) {
                blockRulesRaw = migratedData[storageKey].rules;
                shouldLogRaw = migratedData[storageKey].shouldLog;
            }

            instance = init(blockRulesRaw, shouldLogRaw, true);

            if (callback !== undefined) {
                callback(instance);
            }
        };

        rootObject.storage.sync.get(storageKey, fromStorage);
    };

    /**
     * Returns the global preferences singleton.
     *
     * Changes made to this instance are kept in sync with the database.
     *
     * Callers should call to `loadFromStorage` before calling this method.
     *
     * @return {?Preferences}
     *   Returns a singleton preferences object if one has been loaded from
     *   storage, or undefined if no such instance has been loaded yet.
     */
    const get = () => instance;

    /**
     * Creates a Preferences object from a JSON string.  The returned
     * object is intended to be used read only, and will not have any changes
     * reflected in persistant storage.
     *
     * @param {string} jsonString
     *   A JSON string encoding a set of user preferences, likely generated
     *   from `Preferences.toJSON`.
     *
     * @return {Preferences}
     *   A Preferences object.
     *
     * @throws If provided JSON string is not a valid serilization of
     *   preferences data.
     */
    const fromJSON = jsonString => {
        const data = JSON.parse(jsonString);
        if (typeof data !== "object" || Array.isArray(data) === true) {
            throw `Invalid preferences JSON: ${jsonString} does not encode an object.`;
        }

        if (data.rules === undefined || Array.isArray(data.rules) === false) {
            throw `Invalid preferences JSON: ${jsonString} does not have an array for a "rules" property`;
        }

        if (typeof data.shouldLog !== "boolean") {
            throw `Invalid preferences JSON: ${jsonString} does not have a boolean for a "shouldLog" property`;
        }

        const {rules, shouldLog} = data;
        return init(rules, shouldLog, false);
    };

    /**
     * Returns a new preferences object, with no non-default state.  This is
     * mainly only used for testing.
     *
     * @return {Preferences}
     *   An empty preferences object.
     */
    const initNew = () => {
        return init([], false);
    };

    window.WEB_API_MANAGER.preferencesLib = {
        load,
        get,
        fromJSON,
        initNew,
    };
}());

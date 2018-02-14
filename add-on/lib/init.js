// Initial content script for the Web API manager extension, that creates
// the "namespace" we'll use for all the content scripts in the extension.
(function () {
    "use strict";

    // If this code is being included by a unit test, the window object
    // won't exist, so stub it out here.
    try {
        if (window === undefined) {
            // This will throw in node...
        }
    } catch (e) {
        global.window = {};
    }

    /**
     * @enum {ShouldLogVal} string
     * Enum style value that represents all possible setting for the
     * "should log" value.
     *
     * NONE indicates that no logging should occur, STANDARD that selected
     * features should be blocked and loged, and PASSIVE means that nothing
     * should be blocked, but everything should be logged.
     */
    const ShouldLogVal = Object.freeze({
        NONE: "0",
        STANDARD: "1",
        PASSIVE: "2",
    });

    /**
     * @enum {PrefsTabId} string
     * Enum style value that represents all possible ids for preferences
     * tabs.
     */
    const PrefsTabId = Object.freeze({
        BLOCKING_RULES: "blocking-rules",
        IMPORT_EXPORT: "import-export",
        ADVANCED_OPTIONS: "advanced-options",
    });

    window.WEB_API_MANAGER = {
        constants: {
            // The name of the cookie that will be used to push domain
            // configuration information into pages.
            cookieName: "_wamtcstandards",

            // The homepage of the extension.
            homepage: "https://github.com/snyderp/web-api-manager",

            // The name of the catch all rule set used when there are no
            // more specific matching domain rule sets.
            defaultPattern: "(default)",

            // Magic value, used to indicate that a given rule is not an
            // active blocking rule, but is the user-set template rule.
            templatePattern: "(template)",

            // Version of schema used when serializing preferences to storage.
            schemaVersion: 6,
        },
        enums: {
            utils: {
                /**
                 * Enum helper function that throws if the given value is
                 * not a valid value in the enumeration.
                 *
                 * @param {object} enumValues
                 *   An enumerated set of valid values, likely defined in
                 *   window.WEB_API_MANAGER.enums.
                 * @param {*} value
                 *   A value that is expected to be one of the valid values
                 *   in the enumeration.  Implementaton side, this function
                 *   checks that the give value is the value of one of the
                 *   keys in the provided enumValues object.
                 *
                 * @throws
                 *   Throws if the given value is not an expected enumerated
                 *   value.
                 *
                 * @return {undefined}
                 */
                assertValidEnum: (enumValues, value) => {
                    const validValues = new Set(Object.values(enumValues));
                    if (!validValues.has(value)) {
                        throw `${value} is not a valid value for enum ${JSON.stringify(enumValues)}.`;
                    }
                },
            },
            ShouldLogVal,
            PrefsTabId,
        },
    };

    Object.freeze(window.WEB_API_MANAGER.constants);
    Object.freeze(window.WEB_API_MANAGER.enums);
}());

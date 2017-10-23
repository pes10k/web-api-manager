(function () {
    "use strict";
    const {packingLib, standards, constants} = window.WEB_API_MANAGER;
    const standardsNames = Object.keys(standards);
    const shouldLogKey = constants.shouldLogKey;
    const allStandardsWithShouldLogOption = standardsNames.concat([shouldLogKey]);

    /**
     * Creates a cookie safe encoding of standards to block, and
     * whether logging should be enabled.
     *
     * This function is the inverse of the `fromCookieValue` function
     * in this module.
     *
     * The `standardsToBlock` array must be a subset of all the standards
     * documented in data/standards.
     *
     * @param {array} standardsToBlock
     *   An array of strings, each a standard that should be blocked.
     * @param {boolean} shouldLog
     *   Whether logging should be enabled.
     *
     * @return {string}
     *   A cookie safe string encoding the above values.
     */
    const toCookieValue = function (standardsToBlock, shouldLog) {

        const standardsToBlockWithshouldLogKey = shouldLog
            ? standardsToBlock.concat(shouldLogKey)
            : standardsToBlock;

        const packedValues = packingLib.pack(
            allStandardsWithShouldLogOption,
            standardsToBlockWithshouldLogKey
        );

        // Last, replace "=" with "-" in the base64 string, to avoid
        // silly ambiguities in the cookie value.
        return packedValues.replace(/=/g, "-");
    };

    /**
     * Takes a encoded string (created from the `toCookieValue` function
     * in this module) and returns to values, one an array of
     * standard names, and two, a boolean flag of whether the logging option
     * is enabled.
     *
     * @param {string} data
     *   A string created from `toCookieValue`
     *
     * @return {[array, bool]}
     *   An array of strings of standard names (representing standards to
     *   block), and a boolean describing whether to log blocking
     *   behavior.
     */
    const fromCookieValue = function (data) {

        const base64Data = data.replace(/-/g, "=");

        const unpackedValues = packingLib.unpack(allStandardsWithShouldLogOption, base64Data);

        let shouldLog;
        const standardsToBlock = unpackedValues;
        const indexOfShouldLog = unpackedValues.indexOf(shouldLogKey);

        if (indexOfShouldLog === -1) {
            shouldLog = false;
        } else {
            shouldLog = true;
            standardsToBlock.splice(indexOfShouldLog, 1);
        }

        return [standardsToBlock, shouldLog];
    };

    window.WEB_API_MANAGER.cookieEncodingLib = {
        toCookieValue,
        fromCookieValue
    };
}());

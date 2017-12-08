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
     * The returned cookie value will be in the following format:
     *   "<base64 string encoding a bitstring>"@"<nonce>".replace("=", "-")
     *
     * @param {array} standardsToBlock
     *   An array of strings, each a standard that should be blocked.
     * @param {boolean} shouldLog
     *   Whether logging should be enabled.
     * @param {string} randNonce
     *   A unique, unguessable identifier, used so that the injected content
     *   script can communicate with the content script, using an unguessable
     *   event name (so that the guest page cannot listen to or spoof
     *   these messages).
     *
     * @return {string}
     *   A cookie safe string encoding the above values.
     */
    const toCookieValue = (standardsToBlock, shouldLog, randNonce) => {

        const standardsToBlockWithshouldLogKey = shouldLog
            ? standardsToBlock.concat(shouldLogKey)
            : standardsToBlock;

        const packedValues = packingLib.pack(
            allStandardsWithShouldLogOption,
            standardsToBlockWithshouldLogKey
        );

        // Next, append the rand nonce to the end of the cookie string.  Since
        // "@" is guaranteed to never be a character in a base64 encoded
        // string, we can use it as a separator between the packed cookie
        // values and the nonce.
        const packedCookieValue = packedValues + "@" + randNonce;

        // Last, replace "=" with "-" in the base64 string, to avoid
        // silly ambiguities in the cookie value.
        return packedCookieValue.replace(/=/g, "-");
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
     * @return {[array, bool, string]}
     *   An array of length three.  The first value in the returned array is
     *   an array of strings of standard names (representing standards to
     *   block).  The second value is a boolean describing whether to log
     *   blocking behavior.  The third value is a random nonce.
     */
    const fromCookieValue = data => {
        const [packedValues, randNonce] = data.replace(/-/g, "=").split("@");
        const unpackedValues = packingLib.unpack(allStandardsWithShouldLogOption, packedValues);

        let shouldLog;
        const standardsToBlock = unpackedValues;
        const indexOfShouldLog = unpackedValues.indexOf(shouldLogKey);

        if (indexOfShouldLog === -1) {
            shouldLog = false;
        } else {
            shouldLog = true;
            standardsToBlock.splice(indexOfShouldLog, 1);
        }

        return [standardsToBlock, shouldLog, randNonce];
    };

    window.WEB_API_MANAGER.cookieEncodingLib = {
        toCookieValue,
        fromCookieValue
    };
}());

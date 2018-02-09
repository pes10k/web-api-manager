(function () {
    "use strict";
    const {packingLib, standardsLib} = window.WEB_API_MANAGER;
    const allStandardIds = standardsLib.allStandardIds();

    /**
     * Creates a cookie-safe encoding of standard ids to block, and
     * whether logging should be enabled.
     *
     * This function is the inverse of the `fromCookieValue` function
     * in this module.
     *
     * The `standardIdsToBlock` array must be a subset of all the standard ids
     * documented in data/standards.
     *
     * The returned cookie value will be in the following format:
     *   "<base64 string encoding a bitstring>"@"<nonce>".replace("=", "-")
     *
     * @param {array} standardIdsToBlock
     *   An array of strings, each a standard that should be blocked.
     * @param {ShouldLogVal} shouldLog
     *   Whether whether and how logging should be enabled.
     * @param {boolean} shouldBlockCrossFrame
     *   Boolean description of whether to block parent frames from accesing
     *   the DOMs of child frames.
     * @param {string} randNonce
     *   A unique, unguessable identifier, used so that the injected content
     *   script can communicate with the content script, using an unguessable
     *   event name (so that the guest page cannot listen to or spoof
     *   these messages).
     *
     * @return {string}
     *   A cookie safe string encoding the above values.
     */
    const toCookieValue = (standardIdsToBlock, shouldLog, shouldBlockCrossFrame, randNonce) => {
        const cookieValueParts = [];

        const packedValues = packingLib.pack(
            allStandardIds,
            standardIdsToBlock
        );

        cookieValueParts.push(packedValues);
        cookieValueParts.push(shouldLog);
        cookieValueParts.push(shouldBlockCrossFrame ? "1": "0");
        cookieValueParts.push(randNonce);

        const packedCookieValue = cookieValueParts.join("@");

        // Last, replace "=" with "-" in the base64 string, to avoid
        // silly ambiguities in the cookie value.
        return packedCookieValue.replace(/=/g, "-");
    };

    /**
     * Takes a encoded string (created from the `   ` function
     * in this module) and returns to values, one an array of
     * standard names, and two, a boolean flag of whether the logging option
     * is enabled.
     *
     * @param {string} data
     *   A string created from `toCookieValue`
     *
     * @return {[array, ShouldLogVal, boolean, string]}
     *   An array of length three. The first value in the returned array is
     *   an array of strings of standard ids (representing standards to
     *   block). The second value is a ShouldLogVal string, describing the
     *   logging settings. The third value is a whether to block cross
     *   frame DOM access, and the fourth value is a random nonce.
     */
    const fromCookieValue = data => {
        const cookieParts = data.replace(/-/g, "=").split("@");
        const [packedValues, shouldLog, blockCrossFrame, randNonce] = cookieParts;
        const unpackedValues = packingLib.unpack(allStandardIds, packedValues);
        const standardIdsToBlock = unpackedValues;
        const blockCrossFrameBool = blockCrossFrame === "1";

        return [standardIdsToBlock, shouldLog, blockCrossFrameBool, randNonce];
    };

    window.WEB_API_MANAGER.cookieEncodingLib = {
        toCookieValue,
        fromCookieValue,
    };
}());

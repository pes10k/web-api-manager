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
     * @param {ProxyBlockSettings} blockingSettings
     *   Instructions on what and how the blocking script should modify the
     *   executing page.
     *
     * @return {string}
     *   A cookie safe string encoding the above values.
     */
    const toCookieValue = blockingSettings => {
        const cookieValueParts = [];

        const packedValues = packingLib.pack(
            allStandardIds,
            blockingSettings.standardIdsToBlock
        );

        cookieValueParts.push(packedValues);
        cookieValueParts.push(blockingSettings.shouldLog);
        cookieValueParts.push(blockingSettings.blockCrossFrame ? "1": "0");
        cookieValueParts.push(window.btoa(JSON.stringify(blockingSettings.customBlockedFeatures)));
        cookieValueParts.push(blockingSettings.randNonce);

        const packedCookieValue = cookieValueParts.join("@");

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
     * @return {ProxyBlockSettings}
     *   Instructions on what and how the blocking script should modify the
     *   executing page.
     */
    const fromCookieValue = data => {
        const cookieParts = data.replace(/-/g, "=").split("@");
        const [packedValues, shouldLog, blockCrossFrameRaw, encodedCustomFeatures,
            randNonce] = cookieParts;
        const unpackedValues = packingLib.unpack(allStandardIds, packedValues);
        const standardIdsToBlock = unpackedValues;
        const blockCrossFrame = blockCrossFrameRaw === "1";

        const customBlockedFeatures = JSON.parse(window.atob(encodedCustomFeatures));

        return {
            standardIdsToBlock,
            shouldLog,
            blockCrossFrame,
            customBlockedFeatures,
            randNonce,
        };
    };

    window.WEB_API_MANAGER.cookieEncodingLib = {
        toCookieValue,
        fromCookieValue,
    };
}());

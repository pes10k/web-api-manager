/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";

    /**
     * Returns a boolean description of whether the given header
     * (in the structure defined by the WebExtension WebRequest API)
     * is describing a Set-Cookie instruction.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/HttpHeaders
     *
     * @param object header
     *   An object describing a HTTP header
     *
     * @return boolean
     *   true if the given object represents a Set-Cookie instruction, and false
     *   in all other cases.
     */
    const isSetCookie = function (header) {

        return (
            header &&
            header.name &&
            header.name.toLowerCase().indexOf("set-cookie") !== -1
        );
    };

    const isNotHTTPOnlySetCookie = function (header) {

        return (
            header &&
            header.value &&
            header.value.toLowerCase().indexOf("httponly") === -1
        );
    };

    /**
     * Returns a boolean description of whether the given header
     * (in the structure defined by the WebExtension WebRequest API)
     * is describing a Content-Security-Policy for a site.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/HttpHeaders
     *
     * @param object header
     *   An object describing a HTTP header
     *
     * @return boolean
     *   true if the given object represents a HTTP CSP header, and false
     *   in all other cases.
     */
    const isHeaderCSP = function (header) {

        return (
            header &&
            header.name &&
            header.name.toLowerCase().indexOf("content-security-policy") !== -1
        );
    };

    /**
     * Returns a boolean description of whether the given header
     * (in the structure defined by the WebExtension WebRequest API)
     * is describing a strict dynamic Content-Security-Policy for a site.
     *
     * @see https://w3c.github.io/webappsec-csp/#strict-dynamic-usage
     *
     * @param object header
     *   An object describing a HTTP header
     *
     * @return boolean
     *   true if the given object is a CSP header that defines a
     *   "strict-dynamic" policy, and false in all other cases.
     */
    const isCSPHeaderSettingScriptSrc = function (header) {

        return (
            header &&
            header.value &&
            header.value.indexOf("script-src") !== -1
        );
    };

    /**
     * Returns a new CSP instruction, with source with the given hash
     * whitelisted.
     *
     * @see https://w3c.github.io/webappsec-csp/#strict-dynamic-usage
     * @see https://w3c.github.io/webappsec-csp/#grammardef-hash-source
     *
     * @param string cspInstruction
     *   The value of a HTTP header defining a CSP instruction.
     * @param string scriptHash
     *   A hash value, in the form of "sha256-<some hash>", that is a valid
     *   hash source description.
     *
     * @return string|false
     *   Returns false if the CSP instruction looks malformed (ie we
     *   couldn't find a "script-src" tag), otherwise, a new valud
     *   CSP instruction with the given hash allowed.
     */
    const createCSPInstructionWithHashAllowed = function (cspInstruction, scriptHash) {

        const indexOfScriptSrc = cspInstruction.indexOf("script-src ");
        if (indexOfScriptSrc === -1) {
            return false;
        }

        const preSrcScript = cspInstruction.substring(0, indexOfScriptSrc);
        const postScriptSrc = cspInstruction.substring(indexOfScriptSrc + 11);
        const newInstruction = preSrcScript + "script-src '" + scriptHash + "' " + postScriptSrc;

        return newInstruction;
    };

    window.WEB_API_MANAGER.httpHeadersLib = {
        isSetCookie,
        isNotHTTPOnlySetCookie,
        isHeaderCSP,
        isCSPHeaderSettingScriptSrc,
        createCSPInstructionWithHashAllowed
    };
}());
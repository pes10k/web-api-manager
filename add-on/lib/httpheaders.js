(function () {
    "use strict";

    /**
     * Returns a boolean description of whether the given header
     * (in the structure defined by the WebExtension WebRequest API)
     * matches the following critera:
     *   1. Is a content-security-policy instruction
     *   2. Includes either a script-src or default-src rule, and
     *   3. That rule _does not_ include an 'unsafe-inline' instruction.
     *
     * This function is used to determine whether we need to inject a hash
     * of the injected proxyblocking code into the pages CSP policy, to white
     * list our script.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/HttpHeaders
     * @see https://w3c.github.io/webappsec-csp/
     *
     * @param {object} header
     *   An object describing a HTTP header
     *
     * @return {boolean}
     *   true if the given object depicts a CSP policy with the above stated
     *   properties, and false in all other cases.
     */
    const isHeaderCSPScriptSrcWithOutUnsafeInline = function (header) {
        if (!header ||
                !header.name ||
                header.name.toLowerCase().indexOf("content-security-policy") === -1) {
            return false;
        }

        const cspInstruction = header.value;
        let relevantRule;

        if (cspInstruction.indexOf("script-src ") !== -1) {
            relevantRule = "script-src";
        } else if (cspInstruction.indexOf("default-src ") !== -1) {
            relevantRule = "default-src";
        } else {
            return false;
        }

        const scriptSrcInstructionPattern = new RegExp(relevantRule + " .*?(?:;|$)", "i");
        const match = scriptSrcInstructionPattern.exec(cspInstruction);

        if (!match) {
            return false;
        }

        return match[0].indexOf("'unsafe-inline'") === -1;
    };

    /**
     * Returns a new CSP instruction, with source with the given hash
     * whitelisted.
     *
     * If the CSP instruction has a "script-src" rule, then the hash-value
     * will be inserted there.  Otherwise, it will be inserted in the
     * default-src section.
     *
     * @see https://w3c.github.io/webappsec-csp/#strict-dynamic-usage
     * @see https://w3c.github.io/webappsec-csp/#grammardef-hash-source
     *
     * @param {string} cspInstruction
     *   The value of a HTTP header defining a CSP instruction.
     * @param {string} scriptHash
     *   A hash value, in the form of "sha256-<some hash>", that is a valid
     *   hash source description.
     *
     * @return {string|false}
     *   Returns false if the CSP instruction looks malformed (ie we
     *   couldn't find either a "script-src" or "default-src" section),
     *   otherwise, a new value CSP instruction with the given hash allowed.
     */
    const createCSPInstructionWithHashAllowed = function (cspInstruction, scriptHash) {
        const indexOfScriptSrc = cspInstruction.indexOf("script-src ");
        const indexOfDefaultSrc = cspInstruction.indexOf("default-src ");

        let ruleToModify, indexOfRuleStart;
        if (indexOfScriptSrc !== -1) {
            ruleToModify = "script-src";
            indexOfRuleStart = indexOfScriptSrc;
        } else if (indexOfDefaultSrc !== -1) {
            ruleToModify = "default-src";
            indexOfRuleStart = indexOfDefaultSrc;
        } else {
            return false;
        }
        const lengthOfRule = ruleToModify.length;

        const preSrcRule = cspInstruction.substring(0, indexOfRuleStart);
        const postSrcRule = cspInstruction.substring(indexOfRuleStart + lengthOfRule);
        const newInstruction = preSrcRule + ruleToModify + " '" + scriptHash + "' " + postSrcRule;

        return newInstruction;
    };

    window.WEB_API_MANAGER.httpHeadersLib = {
        isHeaderCSPScriptSrcWithOutUnsafeInline,
        createCSPInstructionWithHashAllowed,
    };
}());

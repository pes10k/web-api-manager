(function () {
    "use strict";
    const {constants} = window.WEB_API_MANAGER;

    // From https://www.npmjs.com/package/escape-string-regexp
    const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

    const escapeStringRegexp = function (aString) {
        if (typeof aString !== "string") {
            throw new TypeError("Expected a string");
        }

        return aString.replace(matchOperatorsRe, "\\$&");
    };

    // From https://www.npmjs.com/package/matcher
    const reCache = new Map();

    const makeRe = function (pattern, shouldNegate) {

        const cacheKey = pattern + shouldNegate;

        if (reCache.has(cacheKey)) {
            return reCache.get(cacheKey);
        }

        const negated = pattern[0] === "!";

        if (negated) {
            pattern = pattern.slice(1);
        }

        pattern = escapeStringRegexp(pattern).replace(/\\\*/g, ".*");

        if (negated && shouldNegate) {
            pattern = `(?!${pattern})`;
        }

        const re = new RegExp(`^${pattern}$`, "i");
        re.negated = negated;
        reCache.set(cacheKey, re);

        return re;
    };

    const extractHostNameFromUrl = function (url) {
        const uri = window.URI.parse(url);
        return uri.host;
    };

    const matchingUrlReduceFunction = function (hostName, prev, next) {

        if (prev) {
            return prev;
        }

        if (makeRe(next, true).test(hostName)) {
            return next;
        }

        // Also apply a slightly looser match, to make rules in the form
        // of *.example.com match example.com.
        if (next.startsWith("*.") &&
                next.endsWith(hostName) &&
                next.length === hostName.length + 2) {
            return next;
        }

        return prev;
    };

    /**
     * Returns the match patern that matches given host name.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
     *
     * @param {array} matchPatterns
     *   An array of strings, each describing a match patern.
     * @param {string} hostName
     *   A string depicting a host name.
     *
     * @return {string|undefined}
     *   A match patern string that matches the hostname, or undefined if no
     *   patterns match.
     */
    const matchHostName = function (matchPatterns, hostName) {
        const matchingUrlReduceFunctionBound = matchingUrlReduceFunction.bind(undefined, hostName);
        const matchingPattern = matchPatterns
            .filter((aRule) => aRule !== constants.defaultDomainRule)
            .sort()
            .reduce(matchingUrlReduceFunctionBound, undefined);

        return matchingPattern || undefined;
    };

    /**
     * Returns the match patern that matches the host of a given url.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
     *
     * @param {array} matchPatterns
     *   An array of strings, each describing a match patern.
     * @param {string} url
     *   A string depicting a url.
     *
     * @return {string|undefined}
     *   A match patern string that matches the host portion of the given
     *   url, or undefined if no patterns match.
     */
    const matchUrl = function (matchPatterns, url) {
        const hostName = extractHostNameFromUrl(url);
        return matchHostName(matchPatterns, hostName);
    };

    window.WEB_API_MANAGER.domainMatcherLib = {
        matchHostName,
        matchUrl
    };
}());

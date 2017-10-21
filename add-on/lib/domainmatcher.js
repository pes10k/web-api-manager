/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";
    const defaultKey = "(default)";

    // From https://www.npmjs.com/package/escape-string-regexp
    const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

    const escapeStringRegexp = function (aString) {
        if (typeof aString !== 'string') {
            throw new TypeError('Expected a string');
        }
    
        return aString.replace(matchOperatorsRe, '\\$&');
    };

    // From https://www.npmjs.com/package/matcher
    const reCache = new Map();
    
    const makeRe = function (pattern, shouldNegate) {

        const cacheKey = pattern + shouldNegate;
    
        if (reCache.has(cacheKey)) {
            return reCache.get(cacheKey);
        }
    
        const negated = pattern[0] === '!';
    
        if (negated) {
            pattern = pattern.slice(1);
        }
    
        pattern = escapeStringRegexp(pattern).replace(/\\\*/g, '.*');
    
        if (negated && shouldNegate) {
            pattern = `(?!${pattern})`;
        }
    
        const re = new RegExp(`^${pattern}$`, 'i');
        re.negated = negated;
        reCache.set(cacheKey, re);
    
        return re;
    };

    const extractHostNameFromUrl = function (url) {
        const uri = window.URI(url);
        return uri.hostname();
    };

    const matchingUrlReduceFunction = function (hostName, prev, next) {

        if (prev) {
            return prev;
        }

        if (makeRe(next, true).test(hostName)) {
            return next;
        }

        return prev;
    };

    const matchHostName = function (domainRegExes, hostName) {
        // of the URL being requested.
        const matchingUrlReduceFunctionBound = matchingUrlReduceFunction.bind(undefined, hostName);
        const matchingPattern = domainRegExes
            .filter((aRule) => aRule !== defaultKey)
            .sort()
            .reduce(matchingUrlReduceFunctionBound, undefined);

        return matchingPattern || undefined;
    };

    const matchUrl = function (domainRegExes, url) {
        const hostName = extractHostNameFromUrl(url);
        return matchHostName(domainRegExes, hostName);
    };

    window.WEB_API_MANAGER.domainMatcherLib = {
        matchHostName,
        matchUrl
    };

}());
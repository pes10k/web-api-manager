/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";
    const defaultKey = "(default)";

    const extractHostNameFromUrl = function (url) {
        const uri = window.URI(url);
        return uri.hostname();
    };

    const matchingUrlReduceFunction = function (hostName, prev, next) {
        if (prev) {
            return prev;
        }

        const domainRegex = new RegExp(next);
        if (domainRegex.test(hostName)) {
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
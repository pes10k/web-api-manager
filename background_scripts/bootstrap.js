/*jslint es6: true*/
/*global chrome, browser, window, URI*/
(function () {

    const {packingLib, standards, storageLib} = window.WEB_API_MANAGER;
    const rootObject = window.browser || window.chrome;

    // Once loaded from storage, will be a mapping from regular expressions
    // (or the default option, "(default)"), to an array of standards
    // that should be blocked on matching domains.
    let domainRules;

    storageLib.get(function (loadedDomainRules) {
        domainRules = loadedDomainRules;
    });

    rootObject.runtime.onMessage.addListener(function (request, sender, tab) {
        const [label, data] = request;
        // Listen for updates to the domain rules from the config page.
        if (label === "rulesUpdate") {
            domainRules = data;
        }
    });

    const extractHostFromUrl = function (url) {
        const uri = URI(url);
        return uri.hostname();
    };

    const matchingUrlReduceFunction = function (domain, prev, next) {
        if (prev) {
            return prev;
        }

        const domainRegex = new RegExp(next);
        if (domainRegex.test(domain)) {
            return next;
        }

        return prev;
    };


    const requestFilter = {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"]
    };
    const requestOptions = ["blocking", "responseHeaders"];




    chrome.webRequest.onHeadersReceived.addListener(function (details) {

        const url = details.url;
        const hostName = extractHostFromUrl(url);
        const defaultKey = "(default)";

        // Decide which set of blocking rules to use, depending on the host
        // of the URL being requested.
        const matchingUrlReduceFunctionBound = matchingUrlReduceFunction.bind(undefined, hostName);
        const matchingPattern = Object
            .keys(domainRules)
            .filter((aRule) => aRule !== defaultKey)
            .sort()
            .reduce(matchingUrlReduceFunctionBound, undefined);

        const standardsToBlock = domainRules[matchingPattern || defaultKey];

        const options = Object.keys(standards);
        const packedValues = packingLib.pack(options, standardsToBlock);

        details.responseHeaders.push({
            name: "Set-Cookie",
            value: `web-api-manager=${packedValues}`
        });

        return {
            responseHeaders: details.responseHeaders
        };
    }, requestFilter, requestOptions);
}());
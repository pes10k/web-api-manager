/*jslint es6: true*/
/*global chrome, browser, window, URI*/
(function () {

    const {packingLib, standards, storageLib} = window.WEB_API_MANAGER;
    const rootObject = window.browser || window.chrome;
    const defaultKey = "(default)";

    // Once loaded from storage, will be a mapping from regular expressions
    // (or the default option, "(default)"), to an array of standards
    // that should be blocked on matching domains.
    let domainRules;

    storageLib.get(function (loadedDomainRules) {
        domainRules = loadedDomainRules;
    });

    // Manage the state of the browser activity, by displaying the number
    // of origins / frames
    const updateBrowserActionBadge = function (activeInfo) {
        const {tabId, windowId} = activeInfo;
        rootObject.tabs.executeScript(
            tabId,
            {
                allFrames: true,
                code: "window.location.host"
            },
            function (allHosts) {

                if (rootObject.runtime.lastError) {
                    rootObject.browserAction.disable(tabId);
                    return;
                }

                rootObject.browserAction.enable(tabId);

                const numFrames = allHosts
                    ? Array.from(new Set(allHosts)).length.toString()
                    : "";

                rootObject.browserAction.setBadgeText({
                    text: numFrames,
                    tabId: tabId
                });
            }
        );
    };

    rootObject.tabs.onUpdated.addListener(updateBrowserActionBadge);
    rootObject.tabs.onActivated.addListener(updateBrowserActionBadge);
    rootObject.windows.onFocusChanged.addListener(updateBrowserActionBadge);

    // Inject the blocking settings for each visited domain / frame.
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

    const whichDomainRuleMatches = function (hostName) {
        // of the URL being requested.
        const matchingUrlReduceFunctionBound = matchingUrlReduceFunction.bind(undefined, hostName);
        const matchingPattern = Object
            .keys(domainRules)
            .filter((aRule) => aRule !== defaultKey)
            .sort()
            .reduce(matchingUrlReduceFunctionBound, undefined);

        return matchingPattern || defaultKey;
    };

    // Listen for updates to the domain rules from the config page.
    rootObject.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        const [label, data] = request;
        if (label === "rulesUpdate") {
            domainRules = data;
            return;
        }

        if (label === "rulesForDomains") {
            const ruleForDomain = data.map(whichDomainRuleMatches);
            const mapping = {};
            for (let i = 0; i < ruleForDomain.length; i += 1) {
                mapping[data[i]] = ruleForDomain[i];
            }
            sendResponse(mapping);
            return;
        }
    });

    const requestFilter = {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"]
    };
    const requestOptions = ["blocking", "responseHeaders"];

    chrome.webRequest.onHeadersReceived.addListener(function (details) {

        const url = details.url;
        const hostName = extractHostFromUrl(url);

        // Decide which set of blocking rules to use, depending on the host
        // of the URL being requested.
        const matchingDomainKey = whichDomainRuleMatches(hostName);
        const standardsToBlock = domainRules[matchingDomainKey];

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
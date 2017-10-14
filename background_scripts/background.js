/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";

    const {packingLib, standards, storageLib, domainMatcherLib} = window.WEB_API_MANAGER;
    const rootObject = window.browser || window.chrome;
    const defaultKey = "(default)";

    // Once loaded from storage, will be a mapping from regular expressions
    // (or the default option, "(default)"), to an array of standards
    // that should be blocked on matching domains.
    let domainRules;

    // The extension depends on this fetch happening before the DOM on any
    // pages is loaded.  The Chrome and Firefox docs *do not* promise this,
    // but in testing this is always the case.
    storageLib.get(function (loadedDomainRules) {
        domainRules = loadedDomainRules;
    });

    // Manage the state of the browser activity, by displaying the number
    // of origins / frames
    const updateBrowserActionBadge = function (activeInfo) {
        const tabId = activeInfo.tabId;
        rootObject.tabs.executeScript(
            tabId,
            {
                allFrames: true,
                code: "window.location.host"
            },
            function (allHosts) {

                if (rootObject.runtime.lastError) {
                    rootObject.browserAction.disable(tabId);
                    rootObject.browserAction.setBadgeText({text: "-"});
                    return;
                }

                rootObject.browserAction.enable(tabId);

                const numFrames = allHosts
                    ? Array.from(new Set(allHosts)).length.toString()
                    : "-";

                rootObject.browserAction.setBadgeText({
                    text: numFrames,
                    tabId: tabId
                });
            }
        );
    };

    rootObject.windows.onFocusChanged.addListener(updateBrowserActionBadge);
    rootObject.tabs.onUpdated.addListener(updateBrowserActionBadge);
    rootObject.tabs.onActivated.addListener(updateBrowserActionBadge);
    rootObject.windows.onFocusChanged.addListener(updateBrowserActionBadge);

    window.setInterval(function () {
        rootObject.tabs.getCurrent(function (currentTab) {
            if (currentTab === undefined) {
                return;
            }
            updateBrowserActionBadge({tabId: currentTab.id});
        });
    }, 1000);

    // Listen for updates to the domain rules from the config page.
    rootObject.runtime.onMessage.addListener(function (request, ignore, sendResponse) {

        const [label, data] = request;
        if (label === "rulesUpdate") {
            domainRules = data;
            return;
        }

        if (label === "rulesForDomains") {

            const matchHostNameBound = domainMatcherLib.matchHostName.bind(undefined, Object.keys(domainRules));
            const rulesForDomains = data.map(matchHostNameBound);
            const domainToRuleMapping = {};

            data.forEach(function (aHostName, index) {
                domainToRuleMapping[aHostName] = rulesForDomains[index] || defaultKey;
            });

            sendResponse(domainToRuleMapping);
            return;
        }
    });

    const requestFilter = {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"]
    };
    const requestOptions = ["blocking", "responseHeaders"];

    // Inject the blocking settings for each visited domain / frame.
    rootObject.webRequest.onHeadersReceived.addListener(function (details) {

        const url = details.url;

        // Decide which set of blocking rules to use, depending on the host
        // of the URL being requested.
        const matchingDomainRule = domainMatcherLib.matchUrl(Object.keys(domainRules), url);
        const standardsToBlock = domainRules[matchingDomainRule || defaultKey];

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

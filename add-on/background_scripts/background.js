/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";

    const {storageLib, domainMatcherLib, constants} = window.WEB_API_MANAGER;
    const {cookieEncodingLib, proxyBlockLib, httpHeadersLib} = window.WEB_API_MANAGER;
    const {standards} = window.WEB_API_MANAGER;
    const rootObject = window.browser || window.chrome;
    const defaultKey = "(default)";

    // Once loaded from storage, will be a mapping from regular expressions
    // (or the default option, "(default)"), to an array of standards
    // that should be blocked on matching domains.
    let domainRules;
    let shouldLog;

    // The extension depends on this fetch happening before the DOM on any
    // pages is loaded.  The Chrome and Firefox docs *do not* promise this,
    // but in testing this is always the case.
    storageLib.get(function (storedValues) {
        domainRules = storedValues.domainRules;
        shouldLog = storedValues.shouldLog;
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

                if (rootObject.runtime.lastError && !allHosts) {
                    rootObject.browserAction.setBadgeText({text: "-"});
                    return;
                }

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

    window.setInterval(function () {
        rootObject.tabs.getCurrent(function (currentTab) {
            if (currentTab === undefined) {
                return;
            }
            updateBrowserActionBadge({tabId: currentTab.id});
        });
    }, 1000);

    // Listen for updates to the domain rules from the config page.
    // The two types of messages that are sent to the background page are
    // "stateUpdate", which comes from the config page, indicating the domain
    // blocking / matching rules have changed, and the "rulesForDomains"
    // message, which comes from the browserAction popup, and is a request
    // for information about "here are the domains of the frames on the
    // current page, which rules are being used to match them".
    rootObject.runtime.onMessage.addListener(function (request, ignore, sendResponse) {

        const [label, data] = request;
        if (label === "stateUpdate") {
            domainRules = data.domainRules;
            shouldLog = data.shouldLog;
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

    const cookieRemoverRegex = new RegExp(constants.cookieName + "=.*?;");

    // Make sure we never send the cookie value that contains what
    // standards should be blocked to any server, anytime.  In the common
    // case this will be a NOOP (since the cookie is deleted after being
    // read), but there are some inconsitancy / timing situations where
    // making multiple, simultanious requests to the same domain where
    // we might make a request before deleting the cookie, so the below
    // adds at least some (incertain) extra protection.
    rootObject.webRequest.onBeforeSendHeaders.addListener(function (details) {

        const newHeaders = details.requestHeaders.map(function (header) {

            if (header.name.indexOf("Cookie") === -1) {
                header;
            }

            const cookieValue = header.value;
            header.value = cookieValue.replace(cookieRemoverRegex, "").trim();
            return header;
        });

        return {
            requestHeaders: newHeaders
        };
    }, requestFilter, ["blocking", "requestHeaders"]);

    // Inject the blocking settings for each visited domain / frame.
    // This needs to be done syncronously, so that the DOM of the visited
    // page can be instrumented at "document_start" time.  This means we
    // can't do any of the "obvious" techniques for loading the "what should"
    // be blocked in this frame" information (ie using the storage API).
    // So, instead, we halt at the http query point, match the domain being
    // loaded against the current rule set, pack the set of standards
    // that should be blocked into a base64 encoded bitfield, and then
    // push that to the page as a cookie.
    //
    // The page then reads the information about what standards to block
    // out of the cookie (by decoding and unpacking the bitfield), and then
    // deletes the cookie, so nothing is left behind.
    rootObject.webRequest.onHeadersReceived.addListener(function (details) {

        const url = details.url;

        // Decide which set of blocking rules to use, depending on the host
        // of the URL being requested.
        const matchingDomainRule = domainMatcherLib.matchUrl(Object.keys(domainRules), url);
        const standardsToBlock = domainRules[matchingDomainRule || defaultKey];
        const encodedOptions = cookieEncodingLib.toCookieValue(standardsToBlock, shouldLog);

        // If we're on a site thats sending the "strict-dynamic"
        // Content-Security-Policy instruction, then we need to add the
        // injected proxy code to the list of scripts that are allowed to
        // run in the page.
        const cspDynamicPolicyHeaders = details.responseHeaders
            .filter(httpHeadersLib.isHeaderCSP)
            .filter(httpHeadersLib.isCSPHeaderSettingScriptSrc);

        if (cspDynamicPolicyHeaders.length === 1) {
            const [ignore, scriptHash] = proxyBlockLib.generateScriptPayload(
                standards,
                standardsToBlock,
                shouldLog
            );

            const newCSPValue = httpHeadersLib.createCSPInstructionWithHashAllowed(
                cspDynamicPolicyHeaders[0].value,
                "sha256-" + scriptHash
            );

            if (newCSPValue !== false) {
                cspDynamicPolicyHeaders[0].value = newCSPValue;
            }
        }

        rootObject.cookies.set({
            url: details.url,
            name: constants.cookieName,
            value: encodedOptions
        })

        return {
            responseHeaders: details.responseHeaders
        };

    }, requestFilter, ["blocking", "responseHeaders"]);
}());

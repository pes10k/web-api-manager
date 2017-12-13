/*global sjcl*/
(function () {
    "use strict";

    const {storageLib, domainMatcherLib, constants} = window.WEB_API_MANAGER;
    const {cookieEncodingLib, proxyBlockLib, httpHeadersLib} = window.WEB_API_MANAGER;
    const {standardsLib, tabBlockedFeaturesLib, browserLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();
    const defaultKey = constants.defaultDomainRule;

    // Once loaded from storage, will be a mapping from regular expressions
    // (or the default option, "(default)"), to an array of standards
    // that should be blocked on matching domains.
    let domainRules;
    let shouldLog;

    // The extension depends on this fetch happening before the DOM on any
    // pages is loaded.  The Chrome and Firefox docs *do not* promise this,
    // but in testing this is always the case.
    storageLib.get(storedValues => {
        domainRules = storedValues.domainRules;
        shouldLog = storedValues.shouldLog;
    });

    // Manage the state of the browser activity, by displaying the number
    // of origins / frames
    const updateBrowserActionBadge = activeInfo => {
        const tabId = activeInfo.tabId;
        rootObject.tabs.executeScript(
            tabId,
            {
                allFrames: true,
                code: "window.location.host",
            },
            allHosts => {
                if (rootObject.runtime.lastError && !allHosts) {
                    rootObject.browserAction.setBadgeText({text: "-"});
                    return;
                }

                const numFrames = allHosts
                    ? Array.from(new Set(allHosts)).length.toString()
                    : "-";

                rootObject.browserAction.setBadgeText({
                    text: numFrames,
                    tabId: tabId,
                });
            }
        );
    };

    rootObject.windows.onFocusChanged.addListener(updateBrowserActionBadge);
    rootObject.tabs.onUpdated.addListener(updateBrowserActionBadge);
    rootObject.tabs.onActivated.addListener(updateBrowserActionBadge);

    // Listen for updates to the domain rules from the config page.
    // The two types of messages that are sent to the background page are
    // "stateUpdate", which comes from the config page, indicating the domain
    // blocking / matching rules have changed, and the "rulesForDomains"
    // message, which comes from the browserAction popup, and is a request
    // for information about "here are the domains of the frames on the
    // current page, which rules are being used to match them".
    rootObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const [label, data] = request;

        // Sent from the config page, when the "which APIs should be
        // blocked for which domains" has been changed on the config page.
        if (label === "stateUpdate") {
            domainRules = data.domainRules;
            shouldLog = data.shouldLog;
            return;
        }

        // Sent from the popup / browser action, asking for information about
        // which blocking rules are being applied to which domains in the
        // tab.
        if (label === "rulesForDomains") {
            const matchHostName = domainMatcherLib.matchHostName;
            const matchHostNameBound = matchHostName.bind(undefined, Object.keys(domainRules));
            const domainToRuleMapping = {};

            data.forEach(aHostName => {
                const ruleNameForHost = matchHostNameBound(aHostName) || defaultKey;
                domainToRuleMapping[aHostName] = {
                    "ruleName": ruleNameForHost,
                    "numRules": domainRules[ruleNameForHost].length,
                };
            });

            sendResponse({
                domainData: domainToRuleMapping,
                shouldLog: shouldLog,
            });
            return;
        }

        // Sent from the popup / browser action, that the user wants to view
        // the blocking report for the currently active tab.
        if (label === "openReportPage") {
            browserLib.queryTabs({active: true, currentWindow: true }, tabs => {
                const visibileTabId = tabs[0].id;
                rootObject.tabs.create({
                    url: `/pages/report/report.html?tabId=${visibileTabId}`,
                });
            });
            return;
        }

        // Sent from the popup / browser action, saying that a given
        // host name should have the default blocking rule applied
        // (action === "block", or all APIs allowed
        // (action === "allow").
        if (label === "toggleBlocking") {
            const {action, hostName} = data;
            if (action === "block") {
                delete domainRules[hostName];
                sendResponse(["toggleBlockingResponse", domainRules[defaultKey].length]);
            } else if (action === "allow") {
                domainRules[hostName] = [];
                sendResponse(["toggleBlockingResponse", 0]);
            }

            storageLib.set({
                domainRules,
                shouldLog,
            });
            return;
        }

        // Sent from content script (which is relaying the message from the
        // injected web script) that a feature was blocked in a frame.
        // The "data" object here will contain two properties, "standard",
        // the Web API standard that contains the feature that was blocked,
        // and "feature", a string of the keypath to the feature that was
        // blocked.
        if (label === "blockedFeature") {
            const {feature} = data;
            tabBlockedFeaturesLib.reportBlockedFeature(
                sender.tab.id,
                sender.frameId,
                feature
            );
            return;
        }

        // Request from the report tab for information about which features
        // have been blocked on a given tab.  The "data" object here will
        // be an object in the shape of {tabId: <integer>}, describing the
        // tab we want the report for, or undefined if the requester
        // wants information for all tabs.
        if (label === "blockedFeaturesReport") {
            if (data === undefined || data.tabId === undefined) {
                const reportData = tabBlockedFeaturesLib.getBlockReport().toJSON();
                sendResponse(["blockedFeaturesReportResponse", reportData]);
                return;
            }

            const tabReport = tabBlockedFeaturesLib.getTabReport(data.tabId);
            sendResponse(["blockedFeaturesReportResponse", tabReport && tabReport.toJSON()]);
            return;
        }
    });

    const requestFilter = {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"],
    };

    const cookieRemoverRegex = new RegExp(constants.cookieName + "=.*?;");

    // Make sure we never send the cookie value that contains what
    // standards should be blocked to any server, anytime.  In the common
    // case this will be a NOOP (since the cookie is deleted after being
    // read), but there are some inconsistency / timing situations where
    // making multiple, simultaneous requests to the same domain where
    // we might make a request before deleting the cookie, so the below
    // adds at least some (uncertain) extra protection.
    rootObject.webRequest.onBeforeSendHeaders.addListener(details => {
        const newHeaders = details.requestHeaders.map(header => {
            if (header.name.indexOf("Cookie") === -1) {
                return header;
            }

            const cookieValue = header.value;
            header.value = cookieValue.replace(cookieRemoverRegex, "").trim();
            return header;
        });

        return {
            requestHeaders: newHeaders,
        };
    }, requestFilter, ["blocking", "requestHeaders"]);

    // Inject the blocking settings for each visited domain / frame.
    // This needs to be done synchronously, so that the DOM of the visited
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
    rootObject.webRequest.onHeadersReceived.addListener(details => {
        // In rare cases, the browser might make the first request before
        // its loaded the settings for the extension.  If thats the case, there
        // is nothing meaningful we can do, other than try again next time.
        if (domainRules === undefined) {
            return;
        }

        const url = details.url;

        // Decide which set of blocking rules to use, depending on the host
        // of the URL being requested.
        const matchingDomainRule = domainMatcherLib.matchUrl(Object.keys(domainRules), url);
        const standardIdsToBlock = domainRules[matchingDomainRule || defaultKey];

        const randBytes = sjcl.random.randomWords(4);
        const randNonce = sjcl.codec.base64.fromBits(randBytes);
        const encodedOptions = cookieEncodingLib.toCookieValue(
            standardIdsToBlock,
            shouldLog,
            randNonce
        );

        rootObject.cookies.set({
            url: details.url,
            name: constants.cookieName,
            value: encodedOptions,
        });

        // If there are no standards to block on this domain, then there is
        // no need to modify the CSP headers, since no script will be injected
        // into the page.
        if (standardIdsToBlock.length === 0) {
            return;
        }

        // If we're on a site thats sending the "strict-dynamic"
        // Content-Security-Policy instruction, then we need to add the
        // injected proxy code to the list of scripts that are allowed to
        // run in the page.
        const cspDynamicPolicyHeaders = details.responseHeaders
            .filter(httpHeadersLib.isHeaderCSPScriptSrcWithOutUnsafeInline);

        if (cspDynamicPolicyHeaders.length === 1) {
            const [ignore, scriptHash] = proxyBlockLib.generateScriptPayload(
                standardsLib.allStandardIds(),
                standardIdsToBlock,
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

        return {
            responseHeaders: details.responseHeaders,
        };
    }, requestFilter, ["blocking", "responseHeaders"]);
}());

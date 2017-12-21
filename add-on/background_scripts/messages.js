/**
 * Background script responsible for handling all messages to and from
 * content scripts, popups and the configuration page.
 */
(function () {
    "use strict";

    const {browserLib, tabBlockedFeaturesLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();

    const register = preferences => {
        rootObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const [label, data] = request;

            if (label === "getPreferences") {
                sendResponse(["getPreferencesResponse", preferences.toJSON()]);
                return;
            }

            // Sent from the config page, when the "which APIs should be
            // blocked for which domains" has been changed on the config page.
            if (label === "stateUpdate") {
                // domainRules = data.domainRules;
                // shouldLog = data.shouldLog;
                return;
            }

            // Sent from the popup / browser action, asking for information about
            // which blocking rules are being applied to which domains in the
            // tab.
            if (label === "rulesForDomains") {
                const hostNames = data;
                const domainToRuleMapping = {};

                hostNames.forEach(aHostName => {
                    const rule = preferences.getRuleForUrl(aHostName);
                    domainToRuleMapping[aHostName] = {
                        ruleName: rule.pattern,
                        numRules: rule.getStandardIds().length,
                    };
                });

                sendResponse({
                    domainData: domainToRuleMapping,
                    shouldLog: preferences.getShouldLog(),
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
                let numBlockedStandardsForHost;
                if (action === "block") {
                    preferences.deleteRule(hostName);
                    numBlockedStandardsForHost = preferences.getDefaultRule().getStandardIds().length;
                } else if (action === "allow") {
                    preferences.upcertRule(hostName, []);
                    numBlockedStandardsForHost = 0;
                }

                sendResponse(["toggleBlockingResponse", numBlockedStandardsForHost]);
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
                if (!data || data.tabId === undefined) {
                    const reportData = tabBlockedFeaturesLib.getBlockReport().toJSON();
                    sendResponse(["blockedFeaturesReportResponse", reportData]);
                    return;
                }

                const tabReport = tabBlockedFeaturesLib.getTabReport(data.tabId);
                sendResponse(["blockedFeaturesReportResponse", tabReport && tabReport.toJSON()]);
                return;
            }
        });
    };

    window.WEB_API_MANAGER.messagesLib = {
        register,
    };
}());
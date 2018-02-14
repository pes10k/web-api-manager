/**
 * Background script responsible for handling all messages to and from
 * content scripts, popups and the configuration page.
 */
(function () {
    "use strict";

    const {browserLib, tabBlockedFeaturesLib, blockRulesLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();

    const onMessageListener = (preferences, request, sender, sendResponse) => {
        const [label, data] = request;

        // Message sent from the configuration page, specifiying that the
        // user has changed some settings regarding which standards should
        // be blocked.
        if (label === "updatePreferenceRules") {
            const {operation, ruleJSON} = data;
            const rule = blockRulesLib.fromJSON(ruleJSON);
            if (operation === "delete") {
                preferences.deleteRuleForPattern(rule.getPattern());
                return;
            }
            if (operation === "add") {
                preferences.addRule(rule);
                return;
            }
            if (operation === "update") {
                preferences.upcertRuleStandardIds(rule.getPattern(), rule.getStandardIds());
                preferences.upcertRuleCustomBlockedFeatures(
                    rule.getPattern(),
                    rule.getCustomBlockedFeatures()
                );
                return;
            }
        }

        if (label === "updatePreferencesBlockCrossFrame") {
            const {blockCrossFrame} = data;
            preferences.setBlockCrossFrame(blockCrossFrame);
            return;
        }

        // Message sent from the preferences page, instructing the background
        // process that the user has changed her "should log" preference,
        // and that persistant storage needs to be updated to track that.
        if (label === "updatePreferencesShouldLog") {
            const {shouldLog} = data;
            preferences.setShouldLog(shouldLog);
            return;
        }

        // Message sent from the configuration page, indicating that the
        // user's "template" (easily re-apply-able set of standards to block)
        // has changed.
        if (label === "updatePreferencesTemplate") {
            const {templateRuleJSON} = data;
            const templateRule = blockRulesLib.fromJSON(templateRuleJSON);
            preferences.setTemplateRule(templateRule);
            return;
        }

        // Message sent from the configuration page, indicating that the
        // user has to changed the match pattern for an existing rule.
        if (label === "updatePreferencesReplacePattern") {
            const {currentPattern, newPattern} = data;
            const existingRule = preferences.getRuleForPattern(currentPattern);
            preferences.deleteRuleForPattern(newPattern);
            existingRule.setPattern(newPattern);
            preferences.addRule(existingRule);
            return;
        }

        // Message sent from configuration and popup pages, asking for read
        // only version of the preferences.
        if (label === "getPreferences") {
            sendResponse(["getPreferencesResponse", preferences.toJSON()]);
            return;
        }

        if (label === "getPreferencesAndFrames") {
            browserLib.queryTabs({active: true, currentWindow: true}, tabs => {
                if (tabs.length === 0) {
                    return;
                }
                browserLib.getAllFrames({tabId: tabs[0].id}, frameResults => {
                    const frameHosts = frameResults
                        .map(frame => {
                            if (frame.errorOccurred === true) {
                                return false;
                            }

                            return window.URI.parse(frame.url).host;
                        })
                        .filter(url => !!url);

                    const uniqueHosts = Array.from(new Set(frameHosts));
                    const data = {
                        prefsJSON: preferences.toJSON(),
                        uniqueHosts,
                    };

                    rootObject.runtime.sendMessage(["getPreferencesAndFramesResponse", data]);
                });
            });
            return;
        }

        // Sent from the popup / browser action, that the user wants to view
        // the blocking report for the currently active tab.
        if (label === "openReportPage") {
            browserLib.queryTabs({active: true, currentWindow: true}, tabs => {
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
                preferences.deleteRuleForPattern(hostName);
                const defaultStdIds = preferences.getDefaultRule().getStandardIds();
                numBlockedStandardsForHost = defaultStdIds.length;
            } else if (action === "allow") {
                preferences.upcertRuleStandardIds(hostName, []);
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

        throw `Received unexpected message type: ${label}.  Passed data: ${JSON.stringify(data)}`;
    };

    const register = preferences => {
        rootObject.runtime.onMessage.addListener(onMessageListener.bind(undefined, preferences));
    };

    window.WEB_API_MANAGER.messagesLib = {
        register,
    };
}());

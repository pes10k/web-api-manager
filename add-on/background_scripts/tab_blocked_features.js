/**
 * This module is responsible for keeping track of which features have
 * been blocked on which tabs (and in which frames on those tabs).  The
 * main data structure is a mapping of:
 *  tab ids -> frame ids -> standard names -> feature names.
 */
(function () {
    const {browserLib, standardsLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();

    // This object will end up being a severally deep nested object,
    // maping tab ids -> frame ids -> standard names -> feature names.
    // The exact struture of the object looks like this:
    // {
    //      aTabId<integer>: {
    //          aFrameId<integer>: {
    //              url: <string>,
    //              standardReports: {
    //                  aStandardId<string>: [
    //                      aFeatureName<string>,
    //                      anotherFeatureName<string>
    //                  ],
    //                  anotherStandardId<string>: [...]
    //              }
    //          },
    //          anotherFrameId<integer>: {...}
    //      },
    //      anotherTabId<integer>: {...}
    // }
    const tabMapping = {};

    rootObject.tabs.onCreated.addListener(tab => {
        tabMapping[tab.id] = {};
    });

    rootObject.tabs.onRemoved.addListener(tabId => {
        delete tabMapping[tabId];
    });

    rootObject.webNavigation.onCommitted.addListener(details => {
        const {tabId, frameId, url} = details;

        // Ignroe frames that are not http or https requests.
        const urlLower = url.toLowerCase();
        if (urlLower.startsWith("http://") === false &&
                urlLower.startsWith("https://") === false) {
            return;
        }

        if (tabMapping[tabId] === undefined) {
            tabMapping[tabId] = {};
        }

        tabMapping[tabId][frameId] = {
            url: url,
            standardReports: {},
        };
    });

    /**
     * Registers that a feature was blocked on a frame.
     *
     * @param {number} tabId
     *   The identifier for a browser tab.
     * @param {number} frameId
     *   The identifier for a frame within the given tab.
     * @param {string} featureName
     *   A keypath identifying a feature that as blocked.
     *
     * @return {undefined}
     */
    const reportBlockedFeature = (tabId, frameId, featureName) => {
        const standardId = standardsLib.standardIdForFeature(featureName);

        const standardReportsForFrame = tabMapping[tabId][frameId].standardReports;
        if (standardReportsForFrame[standardId] === undefined) {
            standardReportsForFrame[standardId] = [];
        }
        standardReportsForFrame[standardId].push(featureName);
    };

    /**
     * Describes which features in a standard were blocked.
     * @typedef StandardReport {Object.<number, Array.strings>}
     */

    /**
     * Describes features were blocked in frames on a tab.
     * @typedef TabReport {Object.<number, FrameReport}
     */

    /**
     * Describes which features were blocked on a frame.
     * @typedef FrameReport
     * @property {string} url
     *   The URL loaded for this frame.
     * @property {Object.<string, StandardReport>} standardReports
     *   An mapping of standardIds, to arrays of features in that standard
     *   that were blocked.
     */

    /**
     * Returns a report that describes which features were blocked in a tab.
     *
     * @param {number} tabId
     *   The identifier for an open browser tab.
     *
     * @return {?TabReport}
     *   A object that describes what features were blocked on this tab, and
     *   on which frames.
     */
    const reportForTab = tabId => tabMapping[tabId];

    window.WEB_API_MANAGER.tabBlockedFeaturesLib = {
        reportBlockedFeature,
        reportForTab,
    };
}());

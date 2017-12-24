/**
 * This module is responsible for keeping track of which features have
 * been blocked on which tabs (and in which frames on those tabs).  The
 * main data structure is a mapping of:
 *  tab ids -> frame ids -> standard names -> feature names.
 */
(function () {
    const {browserLib, reportsLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();

    const blockingReport = reportsLib.init();

    rootObject.tabs.onCreated.addListener(tab => {
        blockingReport.initTabReport(tab.id);
    });

    rootObject.tabs.onRemoved.addListener(tabId => {
        blockingReport.deleteTabReport(tabId);
    });

    rootObject.webNavigation.onCommitted.addListener(details => {
        const {tabId, frameId, url} = details;
        blockingReport.initFrameReport(tabId, frameId, url);
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
        blockingReport.recordBlockedFeature(tabId, frameId, featureName);
    };

    /**
     * Returns information for all features that have been blocked on open tabs.
     *
     * @return {BlockReport}
     *   Returns an object, mapping tab ids to reports about which featurs
     *   have been blocked in those tabs.
     */
    const getBlockReport = () => blockingReport;

    /**
     * Returns information about all feature blocking thats occured on a single
     * tab.
     *
     * @param {number} tabId
     *   The identifier for an open tab.
     *
     * @return {?TabReport}
     *   Either a TabReport object, describing the blocking thats occured
     *   on a tab, or undefined if the tab is not recognized.
     */
    const getTabReport = tabId => blockingReport.getTabReport(tabId);

    window.WEB_API_MANAGER.tabBlockedFeaturesLib = {
        reportBlockedFeature,
        getBlockReport,
        getTabReport,
    };
}());

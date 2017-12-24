/**
 * Functions for interacting with BlockReports, which track what features
 * were blocked, on which frames, in which tabs.
 *
 * The entry point for all the code in this library is usually the
 * init method, which returns a BlockReport object that manages
 * a record of all the feature blocking thats happened.
 *
 * The initTabReport method is provided to do the same, but when you're only
 * interested in reading from already existing logging information (e.g.
 * when displaying an already-existing log of whats been blocked in a tab).
 */
(function () {
    "use strict";

    const {standardsLib} = window.WEB_API_MANAGER;

    /**
     * Describes all feature blocking that has occured in any frame in any tab.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation
     *
     * @typedef {object} BlockReport
     * @property {function(): string} toJSON
     *   Returns a string, that depicts all of the recorded blocking data
     *   as a JSON string.
     * @property {function(number): boolean} initTabReport
     *   Initilizes a tab report for a given tab id in the block report.
     *   Takes the id of the tab that should be initilized in the report,
     *   and returns true if a new tab report was initilized in the report, or
     *   false if otherwise (because there was already a report for the tab id).
     * @property {function(number): ?TabReport} getTabReport
     *   Takes an id for a tab, referring to one of the tabs open in the
     *   browser.  Returns either a TabReport object that describes the blocking
     *   that has occured in that tab, or undefined if the given tab id does
     *   not match an open, tracked tab.
     * @property {function(): Array.TabReport} getAllTabReports
     *   Returns an array containing TabReport objects, collectivly describing
     *   all of the blocking that has occured on all of the tabs in the system.
     * @property {function(string): Array.FrameReport} getFrameReportsForUrl
     *   Returns an array containing FrameReport objects, describing
     *   blocking that has occured on any frames that initially loaded the
     *   given url.
     * @property {function(number): boolean} deleteTabReport
     *   Takes a tab id, describing a tab that is or was open in the browser,
     *   and deletes all logged information about the blocking that occured
     *   in that tab (used to prune the logging data when a tab closes).
     *   Returns true if information about a tab was deleted, and otherwise
     *   false (such as if an unrecognized tab id was provided).
     * @property {function(number, number, string): boolean} initFrameReport
     *   Takes a tab id, frame id and a url, describing a frame that is being
     *   loaded in the browser. Creates a record to record blocking in the frame
     *   (used, for example, when the user opens a new tab, or a tab loads
     *   an iframe).  Returns if a new FrameReport object was initilized, and
     *   otherwise false (such as if an unrecognized tab id was provided,
     *   or there is already a FrameReport for this frame in the specified tab).
     * @property {function(number, number, FeaturePath)} recordBlockedFeature
     *   Takes a tab id, frame id, and identifier for a feature that was blocked
     *   in the frame.  Records that a given feature was blocked.
     */

    /**
     * Represents a tab in the browser where blocking occured, and describes
     * the standards and features that were blocked in the frames in this tab.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs
     *
     * @typedef {object} TabReport
     * @property {function(): string} toJSON
     *   Returns a string, that depicts the data in this tab report, serialized
     *   as JSON.  Creates output designed to be consumed by
     *   reportsLib.tabReportFromJSON.
     * @property {number} id
     *   The identifier for the tab in the browser (as defined in the
     *   WebExtension Tabs API).
     * @property {function(): boolean} isEmpty
     *   Returns whether any blocking or frames have been recorded on this tab.
     * @property {function(): Array.FrameReport} getAllFrameReports
     *   Returns an array of FrameReport objects, each describing the blocking
     *   that occured on a frame in this tab.
     * @property {function(string): Array.FrameReport} getFrameReportsForUrl
     *   Returns an array of FrameReport objects that represent frames
     *   that initially loaded the passed URL.  This is a convience filtering
     *   method that returns a subset of what `getAllFrameReports` returns.
     * @property {function(number): ?FrameReport} getFrameReport
     *   Takes a frameID (as defined in the WebExtension webNavigation API)
     *   that describes a frame that was loaded in this tab, and returns
     *   either a FrameReport object that describes the blocking that occured
     *   on that frame, or undefined if no matching frame exists in this tab.
     */

    /**
     * Represents a frame loaded in a tab, and desribes which standards and
     * features were blocked on that frame.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation
     *
     * @typedef {object} FrameReport
     * @property {string} url
     *   The initial URL that this frame loaded (note that the URL could have
     *   changed since its initial load, but this value will always give
     *   at the initial URL that was loaded).
     * @property {number} id
     *   The frameID (as defined in the WebExtension webNavigation API)
     *   describing this frame.
     * @property {function(): Array.StandardReport} getAllStandardReports
     *   Returns an array of StandardReport objects, each representing a
     *   Web API standard that was blocked at least once in this frame.
     * @property {function(string): ?StandardReport} getStandardReport
     *   Takes a standard id, which describes a Web API standard in the
     *   extension. Either returns a StandardReport object (describing
     *   which features in that standard have been blocked in this frame),
     *   or undefined if no methods in that standard have been blocked so far.
     * @property {function(): boolean} hasBlocked
     *   Returns a boolean description of whether any blocking of Web API
     *   features and standards has occured on this frame.
     */

    /**
     * Represents a standard that was blocked in a frame, and describes which
     * features in the standard were blocked.
     *
     * @typedef {object} StandardReport
     * @property {string} id
     *   The unqiue identifier for a Web API standard in the extension.
     * @property {string} name
     *   The human readable name for this standard
     * @property {function(): number} getNumBlockedFeatures
     *   Returns the number of features in this standard that were blocked.
     * @property {function(FeaturePath): boolean} wasFeatureBlocked
     *   Returns whether the passed feature was blocked in this standard.
     * @property {function(): Array.FeaturePath} featurePaths
     *   Returns an array or strings, each describing a feature that was
     *   blocked in this standard.
     */

    /**
     * A string, describing a keypath to a feature's definition in the DOM.
     * @typedef {string} FeaturePath
     */

    /**
     * Generates a standard report object, that describies which features
     * in a standard were blocked in on a given frame.
     *
     * @param {string} standardId
     *   The unique id for a Web API standard.
     * @param {Array.FeaturePath} blockedFeatures
     *   The features in this standard that were blocked on this frame.
     *
     * @return {StandardReport}
     *   An object describing a standard, and which features were blocked
     *   on that standard.
     */
    const buildStandardReport = (standardId, blockedFeatures) => {
        return Object.freeze({
            id: standardId,
            name: standardsLib.nameForStandardId(standardId),
            getNumBlockedFeatures: () => blockedFeatures.length,
            wasFeatureBlocked: featureName => {
                return blockedFeatures.indexOf(featureName) !== -1;
            },
            featurePaths: () => blockedFeatures.splice(0),
        });
    };

    /**
     * Returns a object describing a frame tracked on a specified tab.
     *
     * @param {BlockReport} blockReport
     *   A blocking report object, describing what features have
     *   been blocked so far.
     * @param {number} tabId
     *   The id of the tab containing the requested frame.
     * @param {number} frameId
     *   The unique identifier for the frame.
     *
     * @return {?FrameReport}
     *   An object describing a frame that was loaded in the specified tab,
     *   or undefined if the frame id or tab id don't match a frame or tab
     *   known to the system.
     */
    const getFrameReport = (blockReport, tabId, frameId) => {
        if (blockReport[tabId] === undefined) {
            return undefined;
        }

        if (blockReport[tabId][frameId] === undefined) {
            return undefined;
        }

        const frameData = blockReport[tabId][frameId];
        const blockedStandardIds = frameData.standards;
        const getAllStandardReports = () => {
            return Object.keys(blockedStandardIds).map(standardId => {
                const blockedFeaturesInStandard = blockedStandardIds[standardId];
                return buildStandardReport(standardId, blockedFeaturesInStandard);
            });
        };
        const getStandardReport = standardId => {
            const blockedFeatures = blockedStandardIds[standardId];
            if (blockedFeatures === undefined) {
                return undefined;
            }
            return buildStandardReport(standardId, blockedFeatures);
        };

        return Object.freeze({
            url: frameData.url,
            id: frameId,
            getAllStandardReports,
            getStandardReport,
            hasBlocked: () => Object.keys(blockedStandardIds).length > 0,
        });
    };

    /**
     * Initilizes a tab report for a given tab id in the block report.
     *
     * If there is already a tab report for this tab in the report, this
     * function call does not make any modifications.
     *
     * @param {BlockReport} blockReport
     *   The blocking report that should be modified.
     * @param {number} tabId
     *   The id of the tab that should be initilized in the report.
     *
     * @return {boolean}
     *   True if a new tab report was initilized in the report, or false
     *   if a new report was not initilized (because there was already a report
     *   for that id).
     */
    const initTabReport = (blockReport, tabId) => {
        if (blockReport[tabId] !== undefined) {
            return false;
        }
        blockReport[tabId] = Object.create(null);
        return true;
    };

    /**
     * Fetches the report of features that were blocked on for a tab.
     *
     * @param {BlockReport} blockReport
     *   The blocking report that should be modified.
     * @param {number} tabId
     *   The identifier for a browser tab.
     *
     * @return {?TabReport}
     *   A object that describes what features were blocked on a tab.
     */
    const getTabReport = (blockReport, tabId) => {
        const tabReport = blockReport[tabId];

        if (tabReport === undefined) {
            return undefined;
        }

        const getFrameReportBound = getFrameReport.bind(undefined, blockReport, tabId);
        const getAllFrameReports = () => Object.keys(blockReport[tabId]).map(getFrameReportBound);
        const getFrameReportsForUrl = url => {
            return getAllFrameReports().filter(frameReport => frameReport.url === url);
        };

        return Object.freeze({
            toJSON: () => {
                const tabReportStorage = Object.create(null);
                tabReportStorage.data = tabReport;
                tabReportStorage.id = tabId;
                return JSON.stringify(tabReportStorage);
            },
            id: tabId,
            isEmpty: () => blockReport[tabId].length === 0,
            getAllFrameReports,
            getFrameReportsForUrl,
            getFrameReport: getFrameReportBound,
        });
    };

    /**
     * Deletes all information about blocking that has occured on a tab.
     *
     * @param {BlockReport} blockReport
     *   The blocking report that should be modified.
     * @param {number} tabId
     *   The id of the tab that should be removed from the blocking report.
     *
     * @return {boolean}
     *   True if information about a tab was deleted from the report, and
     *   false if there was no information about the tab to remove.
     */
    const deleteTabReport = (blockReport, tabId) => {
        if (blockReport[tabId] === undefined) {
            return false;
        }
        delete blockReport[tabId];
        return true;
    };

    /**
     * Initilzies a frame report in a blocking report.
     *
     * @param {BlockReport} blockReport
     *   The blocking report that should be modified.
     * @param {number} tabId
     *   The id of the tab that the provided frame belongs to.
     * @param {number} frameId
     *   The unique identifier for the frame.
     * @param {string} url
     *   The url that the frame is loading.
     *
     * @return {boolean}
     *   true if a frame report was created to track this frame, and false
     *   if otherwise (ie the frame is pointing at a origin we don't track,
     *   like moz-extension://).
     */
    const initFrameReport = (blockReport, tabId, frameId, url) => {
        // If frameId is 0, then its the top level frame being updated,
        // which invalidates any other frame blocking information for the tab.
        if (frameId === 0) {
            deleteTabReport(blockReport, tabId);
        }

        // Don't track any information for trusted extension pages.
        if (url.indexOf("moz-extension://") === 0) {
            return;
        }

        // If there is already a report for this tab, then this function
        // is a NOOP.
        initTabReport(blockReport, tabId);

        blockReport[tabId][frameId] = {
            url: url,
            standards: Object.create(null),
        };
    };

    /**
     * Records that a feature was blocked on a given frame.
     *
     * @param {BlockReport} blockReport
     *   The blocking report that should be modified.
     * @param {number} tabId
     *   The identifier for a browser tab.
     * @param {number} frameId
     *   The identifier for a frame within the given tab.
     * @param {FeaturePath} featurePath
     *   A keypath identifying a feature that as blocked.
     *
     * @return {undefined}
     */
    const recordBlockedFeature = (blockReport, tabId, frameId, featurePath) => {
        const standardId = standardsLib.standardIdForFeature(featurePath);

        const standardReportsForFrame = blockReport[tabId][frameId].standards;
        if (standardReportsForFrame[standardId] === undefined) {
            standardReportsForFrame[standardId] = [];
        }
        standardReportsForFrame[standardId].push(featurePath);
    };

    /**
     * Returns a blocking report object, either initlized with the data
     * encoded in a JSON string, or empty.
     *
     * @param {?string} jsonString
     *   An optional, JSON string, representing the data generated from
     *   a BlockReport.toJSON call.
     *
     * @return {BlockReport}
     *   Returns a blocking report object, either empty, or populated with the
     *   data depicted by the provided JSON string.
     */
    const init = jsonString => {
        const report = jsonString ? JSON.parse(jsonString) : Object.create(null);

        const getTabReportBound = getTabReport.bind(undefined, report);
        const getAllTabReports = function (removeEmpty = true) {
            const allTabReports = Object.keys(report).map(getTabReportBound);
            return removeEmpty
                ? allTabReports.filter(tabReport => tabReport.isEmpty() === false)
                : allTabReports;
        };

        const getFrameReportsForUrl = url => {
            return getAllTabReports()
                .map(tabReport => tabReport.getFrameReportsForUrl(url))
                .reduce((collection, frameReports) => {
                    return collection.concat(frameReports);
                }, []);
        };

        return Object.freeze({
            toJSON: () => JSON.stringify(report),
            initTabReport: initTabReport.bind(undefined, report),
            getTabReport: getTabReportBound,
            getAllTabReports,
            getFrameReportsForUrl,
            deleteTabReport: deleteTabReport.bind(undefined, report),
            initFrameReport: initFrameReport.bind(undefined, report),
            recordBlockedFeature: recordBlockedFeature.bind(undefined, report),
        });
    };

    const tabReportFromJSON = jsonString => {
        const tabReportRaw = JSON.parse(jsonString);
        const tabReportData = tabReportRaw.data;
        const tabId = tabReportRaw.id;

        // In order to reuse the above code, we have to modify the structure
        // of the tab report to look like its a larger blocking report,
        // but with only one tab loaded.  Since all the methods on TabReport
        // (or yielded methods) are read only, this is an ugly, but
        // non-problematic "implementation detail" :P
        const tabReportNestedInBlockReport = Object.create(null);
        tabReportNestedInBlockReport[tabId] = tabReportData;
        return getTabReport(tabReportNestedInBlockReport, tabId);
    };

    window.WEB_API_MANAGER.reportsLib = {
        init,
        tabReportFromJSON,
    };
}());

/**
 * Code designed to paper over the differences between Firefox and Chrome's
 * implementations of the WebExtension standard.
 */
(function () {
    "use strict";

    /**
     * @var {?String} environmentName
     *
     * Undefined until getRootObject is called, and then either "chrome"
     * or "firefox".
     */
    let environmentName;

    /**
     * Returns the root object for this browser environment.
     *
     * Chrome calls it "chrome", and the standard calls it "browser".
     * This function returns a reference to the correct object, whatever
     * its called.
     *
     * @return {object}
     *   The root WebExtension object for this environment.
     */
    const getRootObject = (function () {
        let _rootObject;

        return () => {
            if (_rootObject === undefined) {
                try {
                    if (browser === undefined) {
                        // Throws in Chrome
                    }
                    environmentName = "standard";
                    _rootObject = browser;
                } catch (e) {
                    try {
                        _rootObject = chrome;
                        environmentName = "chrome";
                    } catch (e) {
                        _rootObject = undefined;
                        environmentName = "node?";
                    }
                }
            }

            return _rootObject;
        };
    }());

    /**
     * Provides a common interface for querying tabs.
     *
     * The chrome interface wants a callback function, and the standard
     * specifies a promise.  This function provides a common interface
     * for both environments.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/Tabs/query
     *
     * @param {queryInfo} query
     *   Object describing which tabs should be returned.
     * @param {function} callback
     *   Function that will be called with the result of the tabs.query.
     *
     * @return {undefined}
     */
    const queryTabs = (query, callback) => {
        const rootObject = getRootObject();
        if (environmentName === "chrome") {
            rootObject.tabs.query(query, callback);
            return;
        }

        rootObject.tabs.query(query).then(callback);
    };

    /**
     * Provides a common interface for querying frames in browser tabs.
     *
     * The chrome interface wants a callback function, and the standard
     * specifies a promise.  This function provides a common interface
     * between both environments.
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation/getAllFrames
     * @see https://developer.chrome.com/extensions/webNavigation#method-getAllFrames
     *
     * @param {object} details
     *   A object used to filter which frames to return.
     * @param {function} callback
     *  Function that is called with the results of the frame query.
     *
     * @return {undefined}
     */
    const getAllFrames = (details, callback) => {
        const rootObject = getRootObject();
        if (environmentName === "chrome") {
            rootObject.webNavigation.getAllFrames(details, callback);
            return;
        }

        rootObject.webNavigation.getAllFrames(details).then(callback);
    };

    window.WEB_API_MANAGER.browserLib = {
        getRootObject,
        getAllFrames,
        queryTabs,
    };
}());

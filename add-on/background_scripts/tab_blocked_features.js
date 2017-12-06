/**
 * This module is responsible for keeping track of which features have
 * been blocked on which tabs (and in which frames on those tabs).  The
 * main data structure is a mapping of:
 *  tab ids -> frame ids -> standard names -> feature names.
 */
(function () {

    const rootObject = window.browser || window.chrome;

    // This object will end up being a severally deep nested object,
    // maping tab ids -> frame ids -> standard names -> feature names.
    // The exact struture of the object looks like this:
    // {
    //      aTabId<integer>: {
    //          aFrameId<integer>: {
    //              url: <string>,
    //              standards: {
    //                  aStandardName<string>: [
    //                      aFeatureName<string>,
    //                      anotherFeatureName<string>
    //                  ],
    //                  anotherStandardName<string>: [...]
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
            standards: {}
        };
    });

    const reportBlockedFeature = (tabId, frameId, standard, feature) => {
        const standardsForFrame = tabMapping[tabId][frameId].standards;
        if (standardsForFrame[standard] === undefined) {
            standardsForFrame[standard] = [];
        }
        standardsForFrame[standard].push(feature);
    };

    const featuresForTab = tabId => tabMapping[tabId];

    window.WEB_API_MANAGER.tabBlockedFeaturesLib = {
        reportBlockedFeature,
        featuresForTab
    };
}());

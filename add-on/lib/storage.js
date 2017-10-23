(function () {
    "use strict";

    const rootObject = window.browser || window.chrome;
    const webApiManagerKeySettingsKey = "webApiManager";
    const storageObject = rootObject.storage;

    const get = function (callback) {
        storageObject.sync.get(webApiManagerKeySettingsKey, function (results) {

            let loadedValues = results && results[webApiManagerKeySettingsKey];

            // If there are no currently saved domain rules, then create
            // a stubbed out one, using an empty blocking rule set.
            if (!loadedValues ||
                    !loadedValues.domainRules ||
                    Object.keys(loadedValues.domainRules).length === 0) {

                loadedValues = {
                    domainRules: {
                        "(default)": []
                    },
                    shouldLog: false
                };
            }

            callback(loadedValues);
        });
    };

    const set = function (object, callback) {
        const valueToStore = {};
        valueToStore[webApiManagerKeySettingsKey] = object;
        storageObject.sync.set(valueToStore, callback);
    };

    window.WEB_API_MANAGER.storageLib = {
        get,
        set
    };
}());
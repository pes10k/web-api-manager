/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";

    const rootObject = window.browser || window.chrome;
    const webApiManagerKeySettingsKey = "webApiManagerDomainRules";
    const storageObject = rootObject.storage;

    const get = function (callback) {
        storageObject.local.get(webApiManagerKeySettingsKey, function (results) {

            let loadedDomainRules = results && results[webApiManagerKeySettingsKey];

            // If there are no currently saved domain rules, then create
            // a stubbed out one, using an empty blocking rule set.
            if (!loadedDomainRules || Object.keys(loadedDomainRules).length === 0) {
                loadedDomainRules = {
                    "(default)": []
                };
            }

            callback(loadedDomainRules);
        });
    };

    const set = function (object, callback) {
        const valueToStore = {};
        valueToStore[webApiManagerKeySettingsKey] = object;
        storageObject.local.set(valueToStore, callback);
    };

    window.WEB_API_MANAGER.storageLib = {
        get,
        set
    };
}());
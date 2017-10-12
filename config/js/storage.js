/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";

    const browserObj = window.browser || window.chrome;
    const webApiManagerKeySettingsKey = "webApiManagerDomainRules";
    const storageObject = browserObj.storage;

    const get = function (callback) {
        storageObject.local.get(webApiManagerKeySettingsKey, function (results) {
            callback(results && results[webApiManagerKeySettingsKey]);
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
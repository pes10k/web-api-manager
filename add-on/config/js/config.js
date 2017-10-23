(function () {
    "use strict";

    const rootObject = (window.browser || window.chrome);
    const doc = window.document;
    const standards = window.WEB_API_MANAGER.standards;
    const {storageLib, stateLib} = window.WEB_API_MANAGER;
    const defaultDomain = "(default)";
    const Vue = window.Vue;

    const state = stateLib.generateStateObject(defaultDomain, standards);

    const onSettingsLoaded = function (storedSettings) {

        state.populateFromStorage(storedSettings);

        const vm = new Vue({
            el: doc.body,
            data: state
        });

        const updateStoredSettings = function () {
            storageLib.set(state.toStorage(), function () {
                rootObject.runtime.sendMessage(["stateUpdate", state.toStorage()]);
            });
        };

        vm.$watch("selectedStandards", updateStoredSettings);
        vm.$watch("domainNames", updateStoredSettings);
        vm.$watch("shouldLog", updateStoredSettings);
    };

    window.onload = function () {
        storageLib.get(onSettingsLoaded);
    };
}());

/*jslint es6: true*/
/*global window, browser, chrome, Vue*/
(function () {
    "use strict";

    const rootObject = (window.browser || window.chrome);
    const doc = window.document;
    const standards = window.WEB_API_MANAGER.standards;
    const {storageLib, stateLib} = window.WEB_API_MANAGER;
    const defaultDomain = "(default)";

    const state = stateLib.generateStateObject(defaultDomain, standards);

    const onSettingsLoaded = function (loadedDomainRules) {

        state.setDomainRules(loadedDomainRules);

        const vm = new Vue({
            el: doc.body,
            data: state
        });

        const updateStoredSettings = function () {
            storageLib.set(state.domainRules, function () {
                rootObject.runtime.sendMessage(["rulesUpdate", state.domainRules]);
            });
        };

        vm.$watch("selectedStandards", updateStoredSettings);
        vm.$watch("domainNames", updateStoredSettings);
    };

    const onPageLoad = function () {
        storageLib.get(onSettingsLoaded);
    };

    window.onload = onPageLoad;
}());
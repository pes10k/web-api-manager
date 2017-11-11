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
        state.activeTab = "domain-rules";

        const vm = new Vue({
            el: doc.querySelector("#config-root"),
            render: window.WEB_API_MANAGER.vueComponents["config-root"].render,
            staticRenderFns: window.WEB_API_MANAGER.vueComponents["config-root"].staticRenderFns,
            data: state,
            methods: {
                setActiveTab: function (event) {
                    const targetElement = event.target;
                    this.activeTab = targetElement.hash.replace("#", "");
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
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

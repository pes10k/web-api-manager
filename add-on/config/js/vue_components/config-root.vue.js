(function () {
    "use strict";

    const {storageLib, stateLib, browserLib, constants} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();
    const doc = window.document;
    const defaultDomain = constants.defaultDomainRule;
    const Vue = window.Vue;

    const state = stateLib.generateStateObject(defaultDomain);

    let globalVmInstance;

    const onSettingsLoaded = storedSettings => {
        state.populateFromStorage(storedSettings);
        state.activeTab = "domain-rules";

        globalVmInstance = new Vue({
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
                },
            },
        });

        const updateStoredSettings = function () {
            storageLib.set(state.toStorage(), function () {
                rootObject.runtime.sendMessage(["stateUpdate", state.toStorage()]);
            });
        };

        globalVmInstance.$watch("selectedStandardIds", updateStoredSettings);
        globalVmInstance.$watch("domainNames", updateStoredSettings);
        globalVmInstance.$watch("shouldLog", updateStoredSettings);
    };

    window.onload = function () {
        storageLib.get(onSettingsLoaded);
        storageLib.onChange(function (newStoredValues) {
            globalVmInstance.$data.setDomainRules(newStoredValues.domainRules);
        });
    };
}());

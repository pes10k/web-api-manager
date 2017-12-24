(function () {
    "use strict";

    const {stateLib, browserLib, preferencesLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();
    const doc = window.document;
    const Vue = window.Vue;

    window.onload = () => {
        rootObject.runtime.sendMessage(["getPreferences", undefined], response => {
            const [msgName, data] = response;

            if (msgName !== "getPreferencesResponse") {
                return;
            }

            const preferences = preferencesLib.fromJSON(data);
            const state = stateLib.init(preferences);
            state.dataActiveTab = "blocking-rules";

            new Vue({
                el: doc.querySelector("#config-root"),
                render: window.WEB_API_MANAGER.vueComponents["config-root"].render,
                staticRenderFns: window.WEB_API_MANAGER.vueComponents["config-root"].staticRenderFns,
                data: state,
                methods: {
                    setActiveTab: function (event) {
                        this.dataActiveTab = event.target.hash.replace("#", "");
                        event.stopPropagation();
                        event.preventDefault();
                    },
                },
            });
        });
    };
}());

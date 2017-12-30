(function () {
    "use strict";

    const {stateLib, enums} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("logging-settings", {
        props: ["dataShouldLog"],
        render: window.WEB_API_MANAGER.vueComponents["logging-settings"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["logging-settings"].staticRenderFns,
        computed: {
            enums: () => enums,
        },
        methods: {
            shouldLogChanged: function () {
                const state = this.$root.$data;
                stateLib.setShouldLog(state, this.dataShouldLog);
            },
        },
    });
}());

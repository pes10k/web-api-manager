(function () {
    "use strict";

    const Vue = window.Vue;

    Vue.component("logging-settings", {
        props: ["shouldLog"],
        render: window.WEB_API_MANAGER.vueComponents["logging-settings"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["logging-settings"].staticRenderFns,
        methods: {
            shouldLogChanged: function () {
                this.$root.$data.setShouldLog(this.shouldLog);
            },
        },
    });
}());

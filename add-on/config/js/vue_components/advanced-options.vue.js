(function () {
    "use strict";

    const {stateLib, enums} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("advanced-options", {
        props: ["dataShouldLog", "dataBlockCrossFrame"],
        render: window.WEB_API_MANAGER.vueComponents["advanced-options"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["advanced-options"].staticRenderFns,
        computed: {
            enums: () => enums,
        },
        methods: {
            blockCrossFrameChanged: function () {
                const state = this.$root.$data;
                stateLib.setBlockCrossFrame(state, this.dataBlockCrossFrame);
            },
            shouldLogChanged: function () {
                const state = this.$root.$data;
                stateLib.setShouldLog(state, this.dataShouldLog);
            },
        },
    });
}());

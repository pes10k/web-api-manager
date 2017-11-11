(function () {
    "use strict";

    const standardsDefaults = window.WEB_API_MANAGER.defaults;
    const Vue = window.Vue;

    Vue.component("web-api-standards", {
        props: ["standards", "selectedStandards", "selectedDomain"],
        render: window.WEB_API_MANAGER.vueComponents["web-api-standards"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["web-api-standards"].staticRenderFns,
        methods: {
            onStandardChecked: function () {
                this.$root.$data.setSelectedStandards(this.selectedStandards);
            },
            onLiteClicked: function () {
                this.$root.$data.setSelectedStandards(standardsDefaults.lite);
            },
            onConservativeClicked: function () {
                this.$root.$data.setSelectedStandards(standardsDefaults.conservative);
            },
            onAggressiveClicked: function () {
                this.$root.$data.setSelectedStandards(standardsDefaults.aggressive);
            },
            onClearClicked: function () {
                this.$root.$data.setSelectedStandards([]);
            },
            onAllClicked: function () {
                const allStandards = Object.keys(this.standards)
                    .map(aStdName => this.standards[aStdName].info.identifier);
                this.$root.$data.setSelectedStandards(allStandards);
            }
        }
    });
}());

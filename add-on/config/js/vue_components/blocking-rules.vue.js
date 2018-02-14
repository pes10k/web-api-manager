(function () {
    "use strict";

    const {constants, stateLib} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("blocking-rules", {
        props: ["dataPatterns", "dataSelectedPattern", "dataAllowingAllPatterns", "dataBlockingAnyPatterns"],
        render: window.WEB_API_MANAGER.vueComponents["blocking-rules"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["blocking-rules"].staticRenderFns,
        data: function () {
            return {
                newPattern: "",
                errorMessage: "",
            };
        },
        methods: {
            newPatternSubmitted: function () {
                const state = this.$root.$data;

                if (this.newPattern.length === 0) {
                    this.errorMessage = "Pattern field cannot be empty.";
                    return;
                }

                if (state.preferences.getRuleForPattern(this.newPattern) !== undefined) {
                    this.errorMessage = "There are already settings for this pattern.";
                    return;
                }

                stateLib.addPattern(state, this.newPattern);
                this.errorMessage = "";
                this.newPattern = "";
            },
            onRadioChange: function () {
                const state = this.$root.$data;
                stateLib.setSelectedPattern(state, this.dataSelectedPattern);
            },
            onRemoveClick: function (event) {
                const state = this.$root.$data;
                const targetElement = event.target;
                const pattern = targetElement.dataset.pattern;
                event.stopPropagation();
                event.preventDefault();
                stateLib.deletePattern(state, pattern);
                this.$forceUpdate();
            },
            isDefault: function (pattern) {
                return pattern === constants.defaultPattern;
            },
        },
    });
}());

(function () {
    "use strict";

    const {constants} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("domain-rules", {
        props: ["dataPatterns", "dataSelectedPattern"],
        render: window.WEB_API_MANAGER.vueComponents["domain-rules"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["domain-rules"].staticRenderFns,
        data: function () {
            return {
                newPattern: "",
                errorMessage: "",
            };
        },
        methods: {
            blockingPatterns: function () {
                return this.$root.$data.patternsBlockingStandards();
            },
            allowingPatterns: function () {
                return this.$root.$data.patternsBlockingNoStandards();
            },
            newPatternSubmitted: function () {
                const state = this.$root.$data;

                if (this.newPattern.length === 0) {
                    this.errorMessage = "Pattern field cannot be empty.";
                    return;
                }

                if (this.dataPatterns.indexOf(this.newPattern) !== -1) {
                    this.errorMessage = "There are already settings for this pattern.";
                    return;
                }

                state.addPattern(this.newPattern);
                this.newPattern = "";
            },
            onRadioChange: function () {
                this.$root.$data.setSelectedPattern(this.dataSelectedPattern);
            },
            onRemoveClick: function (event) {
                const targetElement = event.target;
                const pattern = targetElement.dataset.pattern;
                event.stopPropagation();
                event.preventDefault();
                this.$root.$data.deletePattern(pattern);
            },
            isDefault: function (pattern) {
                return pattern === constants.defaultPattern;
            },
        },
    });
}());

(function () {
    "use strict";

    const Vue = window.Vue;

    Vue.component("domain-rules", {
        props: ["domainNames", "selectedDomain"],
        render: window.WEB_API_MANAGER.vueComponents["domain-rules"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["domain-rules"].staticRenderFns,
        data: function () {
            return {
                newDomain: "",
                errorMessage: ""
            };
        },
        methods: {
            newDomainSubmitted: function () {

                const state = this.$root.$data;

                if (this.newDomain.length === 0) {
                    this.errorMessage = "Domain rule field cannot be empty.";
                    return;
                }

                if (state.domainNames.indexOf(this.newDomain) !== -1) {
                    this.errorMessage = "There are already settings for this domain pattern.";
                    return;
                }

                state.addDomainRule(this.newDomain);
                this.newDomain = "";
            },
            onRadioChange: function () {
                this.$root.$data.setSelectedDomain(this.selectedDomain);
            },
            onRemoveClick: function (event) {
                const targetElement = event.target;
                const domain = targetElement.dataset.domain;
                event.stopPropagation();
                event.preventDefault();
                this.$root.$data.deleteDomainRule(domain);
            },
            isDefault: function (domainName) {
                return domainName === "(default)";
            }
        }
    });
}());

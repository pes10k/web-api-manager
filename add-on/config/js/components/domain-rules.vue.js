(function () {
    "use strict";

    const Vue = window.Vue;

    Vue.component("domain-rules", {
        props: ["domainNames", "selectedDomain"],
        template: `
            <div class="domain-rules-container well">
                <div class="radio" v-for="aDomain in domainNames">
                    <label>
                        <input type="radio"
                             :value="aDomain"
                            v-model="selectedDomain"
                            @change="onRadioChange">
                        {{ aDomain }}
                        <span class="glyphicon glyphicon-remove"
                               v-if="!isDefault(aDomain)"
                        data-domain="{{ aDomain }}"
                             @click="onRemoveClick"></span>
                    </label>
                </div>

                <div class="alert alert-danger" role="alert" v-if="errorMessage">
                    {{ errorMessage }}
                </div>

                <div class="form-group" v-bind:class="{ 'has-error': errorMessage }">
                    <label for="newDomainName">Add New Domain Rule</label>
                    <input
                        class="form-control"
                 v-model.trim="newDomain"
                  placeholder="*.example.org">
                </div>

                <button type="submit"
                       class="btn btn-default btn-block"
                      @click="newDomainSubmitted">Add Rule</button>
            </div>
        `,
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

/*jslint es6: true*/
/*global window, browser, Vue*/
(function () {

    const standardsDefaults = window.WEB_API_MANAGER.defaults;

    Vue.component("web-api-standards", {
        props: ["standards", "selectedStandards"],
        template: `
            <div class="web-api-standards-container">
                <div class="form-horizontal">
                    <div class="form-group">
                        <button @click="onConservativeClicked">
                            Use Conservative Settings
                        </button>
                        <button @click="onAggressiveClicked">
                            Use Aggressive Settings
                        </button>
                    </div>
                </div>
                <div class="checkbox" v-for="standard in standards">
                    <label>
                        <input type="checkbox"
                             :value="standard.info.idenitifer"
                            v-model="selectedStandards"
                            @change="onStandardChecked">
                        {{ standard.info.idenitifer }}
                        <a href="{{ standard.info.url }}" v-if="standard.info.url">[info]</a>
                    </label>
                </div>
            </div>
        `,
        methods: {
            onStandardChecked: function () {
                this.$root.$data.setSelectedStandards(this.selectedStandards);
            },
            onConservativeClicked: function () {
                this.$root.$data.setSelectedStandards(standardsDefaults.conservative);
            },
            onAggressiveClicked: function () {
                this.$root.$data.setSelectedStandards(standardsDefaults.aggressive);
            }
        }
    });
}());
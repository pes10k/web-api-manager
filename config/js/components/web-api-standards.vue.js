/*jslint es6: true*/
/*global window, browser, Vue*/
(function () {

    Vue.component("web-api-standards", {
        props: ["standards", "selectedStandards"],
        template: `
            <div class="web-api-standards-container">
                <div class="checkbox" v-for="standard in standards">
                    <label>
                        <input type="checkbox"
                             :value="standard.info.name"
                            v-model="selectedStandards"
                            @change="onStandardChecked">
                        {{ standard.info.name }}
                        <a href="{{ standard.info.url }}" v-if="standard.info.url">[info]</a>
                    </label>
                </div>
            </div>
        `,
        methods: {
            onStandardChecked: function () {
                this.$root.$data.setSelectedStandards(this.selectedStandards);
            }
        }
    });
}());
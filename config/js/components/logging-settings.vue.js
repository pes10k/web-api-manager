/*jslint es6: true, this: true*/
/*global window, Vue*/
(function () {
    "use strict";

    Vue.component("logging-settings", {
        props: ["shouldLog"],
        template: `
            <div class="logging-settings">
                <div class="checkbox">
                    <label>
                        <input type="checkbox"
                            v-model="shouldLog"
                            @change="shouldLogChanged">
                        Log blocked functionality?
                    </label>
                </div>
            </div>
        `,
        methods: {
            shouldLogChanged: function () {
                this.$root.$data.setShouldLog(this.shouldLog);
            }
        }
    });
}());
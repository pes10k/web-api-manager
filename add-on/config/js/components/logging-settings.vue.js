(function () {
    "use strict";

    const Vue = window.Vue;

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

                        <p class="help-block">
                            Enabling logging will print information about each
                            blocked method to the console, for each domain.
                        </p>
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

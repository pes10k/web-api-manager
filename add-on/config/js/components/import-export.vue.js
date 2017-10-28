(function () {
    "use strict";

    const Vue = window.Vue;

    const generateExportString = function (domainsToExport, allDomainData) {

        const dataToExport = domainsToExport.map(function (domain) {
            const domainsToBlock = allDomainData[domain];
            domainsToBlock.sort();
            return {
                "pattern": domain,
                "standards": domainsToBlock
            };
        });

        return JSON.stringify(dataToExport);
    };

    Vue.component("import-export", {
        props: ["domainNames", "selectedStandards"],
        template: `
            <section class="export-section">
                <h2>Export Settings</h2>
                <div class="form-group">
                    <label class="control-label">
                        Select domain rules to export:
                    </label>
                    <select multiple class="form-control" v-model="domainsToExport">
                        <option v-for="domain in domainNames" :value="domain">
                            {{ domain }}
                        </option>
                    </select>
                    <span class="help-block">
                        Select one or more domain rules to export.
                    </span>
                </div>

                <div class="form-group">
                    <label class="control-label">
                        The below is a copy of the selected standards to export elsewhere:
                    </label>
                    <textarea
                        class="form-control"
                        rows="3"
                        readonly
                        v-model="exportedData"
                        placeholder="Exported data will appear here."></textarea>
                </div>
            </section>

            <section class="import-section">
                <h2>Import Settings</h2>

                <div :class="['form-group', {'has-error': importError }]">
                    <label class="control-label">
                        Paste the exported data you'd like to import in the textarea below:
                    </label>
                    <textarea
                        class="form-control"
                        rows="3"
                     v-model="importTextAreaData"
                 placeholder="Paste the data you would like to import below."></textarea>
                </div>

                <div :class="['form-group', {'has-error': importError }]">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" v-model="shouldOverwrite">
                            Overwrite existing settings?
                        </label>
                        <span class="help-block">
                            If this option is selected, than existing options will be
                            overwritten.  If it is unchecked, then the blocked standards
                            for existing domains will not be affected.
                        </span>
                    </div>
                </div>

                <div class="form-group">
                    <button class="btn btn-primary"
                  v-bind:disabled="!isValidToImport()"
                           @click="onImportClicked">Import Settings</button>
                </div>

                <div class="form-group">
                    <label class="control-label">
                        Import log:
                    </label>
                    <textarea
                        readonly
                        :class="['form-control', importError ? 'alert-danger' : '']"
                          rows="3"
                       v-model="importLog"
                   placeholder="The results of each import will be presented here."></textarea>
                </div>
            </section?
        `,
        data: function () {
            return {
                exportedData: "",
                domainsToExport: [],
                importError: false,
                importLog: "",
                importTextAreaData: "",
                dataToImport: "",
                shouldOverwrite: false
            };
        },
        methods: {
            onImportClicked: function (event) {

                if (!this.isValidToImport()) {
                    this.importError = true;
                    this.dataToImport = "";
                    this.importLog = "No data to import.";
                    return;
                }

                const shouldOverwrite = !!this.shouldOverwrite;
                const stateObject = this.$root.$data;
                const currentDomainRules = stateObject.domainRules;
                const newDomainRules = this.dataToImport;
                this.importLog = "";

                const logMessages = newDomainRules.map(function (newDomainRule) {
                    const {pattern, standards} = newDomainRule;
                    if (currentDomainRules[pattern] !== undefined && shouldOverwrite === false) {
                        return ` ! ${pattern}: Skipped. Set to not override.\n`; 
                    }

                    stateObject.setStandardsForDomain(pattern, standards);
                    return ` * ${pattern}: Blocking ${standards.length} standards.\n`;
                });

                this.importError = false;
                this.importLog = logMessages.join("\n");

                event.stopPropagation();
                event.preventDefault();
            },
            isValidToImport: function () {
                return (this.importError === false) && (this.dataToImport !== "");
            }
        },
        watch: {
            selectedStandards: function () {
                this.exportedData = generateExportString(
                    this.domainsToExport,
                    this.$root.$data.domainRules
                );
            },
            domainsToExport: function (selectedDomains) {
                this.exportedData = generateExportString(
                    selectedDomains,
                    this.$root.$data.domainRules
                );
            },
            importTextAreaData: function () {

                const value = this.importTextAreaData;

                if (value.trim() === "") {
                    this.dataToImport = "";
                    this.importError = false;
                    this.importLog = "";
                    return;
                }

                try {
                    this.dataToImport = JSON.parse(value);
                    this.importError = false;
                    this.importLog = "";
                } catch (ignore) {
                    this.dataToImport = "";
                    this.importError = true;
                    this.importLog = "Invalid import data provided.";
                }
            }
        }
    });
}());

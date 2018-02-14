(function () {
    "use strict";

    const standardsDefaults = window.WEB_API_MANAGER.defaults;
    const {standardsLib, categoriesLib, stateLib} = window.WEB_API_MANAGER;
    const {enums, constants, blockRulesLib} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    /**
     * Checks to see if a given match pattern is valid to replace the match
     * pattern for the currently selected rule.
     *
     * @param {string} proposedPattern
     *   A possible match pattern, proposed to replace the match pattern
     *   for the currently selected rule.
     * @param {Preferences} prefs
     *   The preferences for the user, including, most relevantly, the
     *   other blocking rules the user has stored.
     *
     * @return {[boolean, ?string]}
     *   An array of length two.  The first value is a boolean describing
     *   whether the given string is a valid match pattern.  If true,
     *   then the second value will be undefined.  Otherwise, the second
     *   value will be a string describing why the given match pattern
     *   is invalid.
     */
    const isNewPatternValid = (proposedPattern, prefs) => {
        if (proposedPattern.trim() === "")  {
            return [
                false,
                "Match patterns cannot be empty.",
            ];
        }

        const [isValid, error] = blockRulesLib.isValidMatchPattern(proposedPattern);
        if (isValid === false) {
            return [false, error];
        }

        const ruleForProposedPattern = prefs.getRuleForPattern(proposedPattern);
        // If there is a rule in the user's preferences for the pattern
        // in the edit field, and that rule isn't for the currnetly
        // selected pattern (as checked above), then send an error,
        // since it means the user would be changing the pattern
        // for the current rule to match a rule that already exists.
        if (ruleForProposedPattern !== undefined)  {
            return [
                false,
                `There is already a rule for '${proposedPattern}'`,
            ];
        }

        return [true, undefined];
    };

    Vue.component("web-api-standards", {
        props: ["dataCurrentStandardIds", "dataSelectedPattern",
            "dataShouldLog", "dataTemplate", "dataCurrentCustomBlockedFeatures",
            "dataTemplateStandards", "dataTemplateCustomBlockedFeatures"],
        render: window.WEB_API_MANAGER.vueComponents["web-api-standards"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["web-api-standards"].staticRenderFns,
        data: function () {
            return {
                isCustomConfigurationsHidden: true,
                isEditingRulePattern: false,
                defaultPattern: constants.defaultPattern,
                dataEditError: "",
                proposedNewPattern: "",
            };
        },
        computed: {
            sortedCategoryIds: () => {
                const categoryIds = categoriesLib.allCategoryIds();
                return categoryIds.sort(categoriesLib.sortCategoriesById);
            },
            isPassiveMode: function () {
                return this.dataShouldLog === enums.ShouldLogVal.PASSIVE;
            },
            numFeaturesBlocked: function () {
                const prefs = this.$root.$data.preferences;
                const currentRule = prefs.getRuleForPattern(this.dataSelectedPattern);

                const featuresInBlockedStds = this.dataCurrentStandardIds
                    .reduce((collection, stdId) => {
                        return collection.concat(standardsLib.featuresForStandardId(stdId));
                    }, []);
                const customBlockedFeatures = currentRule.getCustomBlockedFeatures();
                const combinedBlockedFeatures = featuresInBlockedStds.concat(customBlockedFeatures);

                return (new Set(combinedBlockedFeatures)).size;
            },
            numStandardsBlocked: function () {
                return this.dataCurrentStandardIds.length;
            },
            numFeaturesInTemplate: function () {
                const newBlockRule = blockRulesLib.init(
                    undefined,
                    this.dataTemplateStandards,
                    this.dataTemplateCustomBlockedFeatures
                );
                return newBlockRule.getAllBlockedFeatures().length;
            },
            numStandardsInTemplate: function () {
                return this.dataTemplateStandards.length;
            },
        },
        methods: {
            getCategoryLib: () => categoriesLib,
            getStandardsLib: () => standardsLib,
            areAllStandardsInCategoryBlocked: function (categoryId) {
                const standardIdsInCat = standardsLib.standardIdsForCategoryId(categoryId);
                const blockedStandardIds = this.dataCurrentStandardIds;

                return standardIdsInCat.every(stdId => blockedStandardIds.includes(stdId));
            },
            toggleCategory: function (event, shouldBlock, categoryId) {
                const state = this.$root.$data;
                const standardIdsInCategory = standardsLib.standardIdsForCategoryId(categoryId);

                const standardIdsInCatSet = new Set(standardIdsInCategory);
                const currentBlockedIdsSet = new Set(this.dataCurrentStandardIds);

                // If shouldBlock === true, then the clicking the button should
                // add all the standards in the category to the set of
                // standards that are blocked on the current domain.  Otherwise,
                // we want to remove all the standards in the category from
                // the set of blocked standards.
                const setOperation = shouldBlock
                    ? Set.prototype.add
                    : Set.prototype.delete;

                standardIdsInCatSet.forEach(setOperation.bind(currentBlockedIdsSet));
                stateLib.setCurrentStandardIds(state, Array.from(currentBlockedIdsSet));
            },
            sortedStandardIdsInCategory: categoryId => {
                const standardIds = standardsLib.standardIdsForCategoryId(categoryId);
                return standardIds.sort(standardsLib.sortStandardsById);
            },
            onStandardChecked: function () {
                const state = this.$root.$data;
                const stdIdsAsNumbers = this.dataCurrentStandardIds;
                stateLib.setCurrentStandardIds(state, stdIdsAsNumbers);
            },
            onLiteClicked: function () {
                const state = this.$root.$data;
                stateLib.setCurrentStandardIds(state, standardsDefaults.lite);
            },
            onConservativeClicked: function () {
                const state = this.$root.$data;
                stateLib.setCurrentStandardIds(state, standardsDefaults.conservative);
            },
            onAggressiveClicked: function () {
                const state = this.$root.$data;
                stateLib.setCurrentStandardIds(state, standardsDefaults.aggressive);
            },
            onClearClicked: function () {
                const state = this.$root.$data;
                stateLib.setCurrentStandardIds(state, []);
            },
            onAllClicked: function () {
                const state = this.$root.$data;
                stateLib.setCurrentStandardIds(state, standardsLib.allStandardIds());
            },
            onSaveTemplateClicked: function () {
                const state = this.$root.$data;

                const customBlockedFeaturesText = String(this.dataCurrentCustomBlockedFeatures);
                const trimmedText = customBlockedFeaturesText.trim();
                const blockedFeaturePaths = (trimmedText === "")
                    ? []
                    : trimmedText.split("\n").map(elm => elm.trim());

                stateLib.setTemplateData(
                    state,
                    state.dataCurrentStandardIds,
                    blockedFeaturePaths
                );
            },
            onApplyTemplateClicked: function () {
                const state = this.$root.$data;
                const templateRule = state.preferences.getTemplateRule();
                stateLib.setCurrentStandardIds(state, templateRule.getStandardIds());
                stateLib.setCustomBlockedFeatures(state, templateRule.getCustomBlockedFeatures());
            },
            onCustomBlockedFeaturesChange: function  () {
                const state = this.$root.$data;
                const customBlockedFeaturesText = String(this.dataCurrentCustomBlockedFeatures);
                const trimmedText = customBlockedFeaturesText.trim();
                const blockedFeaturePaths = (trimmedText === "")
                    ? []
                    : trimmedText.split("\n").map(elm => elm.trim());
                stateLib.setCustomBlockedFeatures(state, blockedFeaturePaths);
            },
            toggleCustomConfigurations: function () {
                this.customConfigurationsHidden = !this.customConfigurationsHidden;
            },
            changePatternSubmitted: function () {
                const state = this.$root.$data;
                const proposedPattern = String(this.proposedNewPattern).trim();

                if (proposedPattern === this.dataSelectedPattern) {
                    this.dataEditError = "No change made to the match pattern.";
                    return;
                }

                const prefs = state.preferences;
                const [isValid, error] = isNewPatternValid(proposedPattern, prefs);
                if (isValid === false) {
                    this.dataEditError = error;
                    return;
                }

                stateLib.changePatternForRule(state, proposedPattern, this.dataSelectedPattern);
                this.dataEditError = "";
                this.isEditingRulePattern = false;
            },
            newPatternChanged: function ()  {
                const fieldValue = String(this.proposedNewPattern).trim();
                // If the pattern in the input field hasn't changed, or is equal
                // to the pattern for the currently selected rule, then
                // its a NOOP, so no error to display.
                if (fieldValue === this.dataSelectedPattern) {
                    this.dataEditError = "";
                    return;
                }

                const prefs = this.$root.$data.preferences;
                const [isValid, error] = isNewPatternValid(fieldValue, prefs);
                if (isValid === false) {
                    this.dataEditError = error;
                    return;
                }

                // Otherwise, things look good, and there is no error to display.
                this.dataEditError = "";
            },
        },
        watch: {
            dataSelectedPattern: function () {
                this.dataEditError = "";
                this.isEditingRulePattern = false;
            },
        },
    });
}());

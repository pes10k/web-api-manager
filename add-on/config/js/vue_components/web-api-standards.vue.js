(function () {
    "use strict";

    const standardsDefaults = window.WEB_API_MANAGER.defaults;
    const {standardsLib, categoriesLib, stateLib, blockRulesLib, enums} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("web-api-standards", {
        props: ["dataCurrentStandardIds", "dataSelectedPattern",
            "dataShouldLog", "dataTemplate", "dataCurrentCustomBlockedFeatures",
            "dataTemplateStandards", "dataTemplateCustomBlockedFeatures"],
        render: window.WEB_API_MANAGER.vueComponents["web-api-standards"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["web-api-standards"].staticRenderFns,
        data: function () {
            return {
                customConfigurationsHidden: true,
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
        },
    });
}());

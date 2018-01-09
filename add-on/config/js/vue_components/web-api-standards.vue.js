(function () {
    "use strict";

    const standardsDefaults = window.WEB_API_MANAGER.defaults;
    const {standardsLib, categoriesLib, stateLib, enums} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("web-api-standards", {
        props: ["dataCurrentStandardIds", "dataSelectedPattern", "dataShouldLog", "dataTemplate"],
        render: window.WEB_API_MANAGER.vueComponents["web-api-standards"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["web-api-standards"].staticRenderFns,
        computed: {
            sortedCategoryIds: () => {
                const categoryIds = categoriesLib.allCategoryIds();
                return categoryIds.sort(categoriesLib.sortCategoriesById);
            },
            isPassiveMode: function () {
                return this.dataShouldLog === enums.ShouldLogVal.PASSIVE;
            },
        },
        methods: {
            getCategoryLib: () => categoriesLib,
            getStandardsLib: () => standardsLib,
            areAllStandardsInCategoryBlocked: function (categoryId) {
                const standardIdsInCat = standardsLib.standardIdsForCategoryId(categoryId);
                const blockedStandardIds = this.dataCurrentStandardIds;

                if (standardIdsInCat.length !== blockedStandardIds.length) {
                    return false;
                }

                return standardIdsInCat.every(stdId => blockedStandardIds.indexOf(stdId) !== -1);
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
                stateLib.setTemplate(state, state.dataCurrentStandardIds);
            },
            onApplyTemplateClicked: function () {
                const state = this.$root.$data;
                stateLib.setCurrentStandardIds(state, state.preferences.getTemplate());
            },
        },
    });
}());

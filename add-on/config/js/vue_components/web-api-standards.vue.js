(function () {
    "use strict";

    const standardsDefaults = window.WEB_API_MANAGER.defaults;
    const {standardsLib, categoriesLib} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("web-api-standards", {
        props: ["dataCurrentStandardIds", "dataSelectedPattern"],
        render: window.WEB_API_MANAGER.vueComponents["web-api-standards"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["web-api-standards"].staticRenderFns,
        computed: {
            sortedCategoryIds: () => {
                const categoryIds = categoriesLib.allCategoryIds();
                return categoryIds.sort(categoriesLib.sortCategoriesById);
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
                this.$root.$data.setCurrentStandardIds(Array.from(currentBlockedIdsSet));
            },
            sortedStandardIdsInCategory: categoryId => {
                const standardIds = standardsLib.standardIdsForCategoryId(categoryId);
                return standardIds.sort(standardsLib.sortStandardsById);
            },
            onStandardChecked: function () {
                this.$root.$data.setCurrentStandardIds(this.dataCurrentStandardIds);
            },
            onLiteClicked: function () {
                this.$root.$data.setCurrentStandardIds(standardsDefaults.lite);
            },
            onConservativeClicked: function () {
                this.$root.$data.setCurrentStandardIds(standardsDefaults.conservative);
            },
            onAggressiveClicked: function () {
                this.$root.$data.setCurrentStandardIds(standardsDefaults.aggressive);
            },
            onClearClicked: function () {
                this.$root.$data.setCurrentStandardIds([]);
            },
            onAllClicked: function () {
                this.$root.$data.setCurrentStandardIds(standardsLib.allStandardIds());
            },
        },
    });
}());

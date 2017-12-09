(function () {
    "use strict";

    const standardsDefaults = window.WEB_API_MANAGER.defaults;
    const {standardsLib, categoriesLib} = window.WEB_API_MANAGER;
    const Vue = window.Vue;

    Vue.component("web-api-standards", {
        props: ["selectedStandardIds", "selectedDomain"],
        render: window.WEB_API_MANAGER.vueComponents["web-api-standards"].render,
        staticRenderFns: window.WEB_API_MANAGER.vueComponents["web-api-standards"].staticRenderFns,
        methods: {
            getCategoryLib: () => categoriesLib,
            getStandardsLib: () => standardsLib,
            sortedCategoryIds: () => {
                const categoryIds = categoriesLib.allCategoryIds();
                return categoryIds.sort(categoriesLib.sortCategoriesById);
            },
            sortedStandardIdsInCategory: (categoryId) => {
                const standardIds = standardsLib.standardIdsForCategoryId(categoryId);
                return standardIds.sort(standardsLib.sortStandardsById);
            },
            onStandardChecked: function () {
                this.$root.$data.setSelectedStandardIds(this.selectedStandardIds);
            },
            onLiteClicked: function () {
                this.$root.$data.setSelectedStandardIds(standardsDefaults.lite);
            },
            onConservativeClicked: function () {
                this.$root.$data.setSelectedStandardIds(standardsDefaults.conservative);
            },
            onAggressiveClicked: function () {
                this.$root.$data.setSelectedStandardIds(standardsDefaults.aggressive);
            },
            onClearClicked: function () {
                this.$root.$data.setSelectedStandardIds([]);
            },
            onAllClicked: function () {
                this.$root.$data.setSelectedStandardIds(standardsLib.allStandardIds());
            },
        },
    });
}());

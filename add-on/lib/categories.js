/**
 * User facing descriptions of categorizations of standards.
 */
(function () {
    "use strict";

    const categories = {
        "computation": {
            "title": "Computation",
            "desc": "Standards developers can use to peform certain " +
                    "types of computation faster, by taking advantage " +
                           "of more cores on a computer.",
        },
        "core": {
            "title": "Core functionality",
            "desc": "Standards that used to provide core, basic web " +
                    "page functionality.",
        },
        "graphics": {
            "title": "Graphics",
            "desc": "Standards that allow websites to do advanced " +
                    "graphical operations, such as very detailed " +
                    "animations and 3d graphics.",
        },
        "hardware": {
            "title": "Hardware",
            "desc": "Standards that allow websites to access sensors " +
                    "and other advanced hardware functonality.",
        },
        "media": {
            "title": "Media and File Handling",
            "desc": "Standards that allow websites to access files, video and " +
                    "media on your computer, beyond typical file uploads.",
        },
        "misc": {
            "title": "Miscellaneous",
            "desc": "Standards that do not easily fall in a broader caegory.",
        },
        "networking": {
            "title": "Networking",
            "desc": "Standards that allow websites to interact with servers, " +
                    "other web browsers, and embedded websites.",
        },
        "presentation": {
            "title": "Presentation",
            "desc": "Standards that change how websites can present their " +
                    "content to users, or how websites can determine how users " +
                    "are interacting with their content.",
        },
        "storage": {
            "title": "Storage",
            "desc": "Standards that allow websites to persistantly store " +
                    "information in your browser, beyond typical cookies.",
        },
        "timing": {
            "title": "Timing",
            "desc": "Standards that allow websites to do high resolution " +
                    "measurements of activies on their pages.",
        },
    };

    /**
     * Returns an array of all of the category ids defined in the system.
     *
     * @return {Array.string}
     *   An array of category ids, encoded as strings.
     */
    const allCategoryIds = () => Object.keys(categories);

    /**
     * Returns the user-facing title for a category id.
     *
     * @param {string} categoryId
     *   The unique identifier for a category.
     *
     * @return {?string}
     *   The user-facing title for a category, or undefined if the category id
     *   is not recognized.
     */
    const titleForCategoryId = categoryId => {
        if (categories[categoryId] === undefined) {
            return undefined;
        }

        return categories[categoryId].title;
    };

    /**
     * Returns the user-facing description of a category.
     *
     * @param {string} categoryId
     *   The unique identifier for a category.
     *
     * @return {?string}
     *   The user-facing description for a category, or undefined if the
     *   category id is not recognized.
     */
    const descriptionForCategoryId = categoryId => {
        if (categories[categoryId] === undefined) {
            return undefined;
        }

        return categories[categoryId].desc;
    };

    /**
     * Sorts two categories based on their name, but identified by their id.
     *
     * @param {string} categoryIdA
     *   The unique identifier for a category.
     * @param {string} categoryIdB
     *   The unique identifier for another category.
     *
     * @return {number}
     *   An integer, of the type returned by String.prototype.localeCompare.
     */
    const sortCategoriesById = (categoryIdA, categoryIdB) => {
        const categoryTitleA = titleForCategoryId(categoryIdA);
        const categoryTitleB = titleForCategoryId(categoryIdB);
        return categoryTitleA.localeCompare(categoryTitleB);
    };

    window.WEB_API_MANAGER.categoriesLib = {
        allCategoryIds,
        titleForCategoryId,
        descriptionForCategoryId,
        sortCategoriesById,
    };
}());

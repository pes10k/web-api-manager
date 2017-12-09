// This code is injected into the programatically generated
// add-ons/lib/standards.js file by the gulp build process.  It creates
// getter and setters around the standards definition.
(function () {
    const {standardsDefinitions} = window.WEB_API_MANAGER.standardsLib;
    delete window.WEB_API_MANAGER.standardsLib.standardsDefinitions;


    /**
     * Returns an array of all of the standard ids defined in the extension.
     *
     * @return {Array.string}
     *   An array of standard ids.
     */
    const allStandardIds = () => Object.keys(standardsDefinitions);

    // Build a mapping of features to standard names, given the initial
    // mapping of standards to features.
    const featureToStandardIdMapping = Object.keys(standardsDefinitions)
        .reduce((collection, standardId) => {
            const standardDefinition = standardsDefinitions[standardId];
            standardDefinition.features.forEach(featureName => {
                collection[featureName] = standardId;
            });
            return collection;
        }, {});

    /**
     * Returns the identifier for a standard that defines the given feature.
     *
     * @param {string} featureName
     *   The keypath defining a feature in the DOM.
     *
     * @return {?string}
     *   Either the id for the standard that defines the given feature,
     *   or undefined if the feature name is not recognized.
     */
    const standardIdForFeature = featureName => featureToStandardIdMapping[featureName];

    /**
     * Returns the human readable name of a standard, from its unique identifier.
     *
     * @param {string} standardId
     *   The unique, constant identifier for a DOM standard.
     *
     * @return {?string}
     *   The user presentable name of a DOM standard, or undefined if the
     *   given standardId is not recognized.
     */
    const nameForStandardId = standardId => {
        if (standardsDefinitions[standardId] === undefined) {
            return undefined;
        }
        return standardsDefinitions[standardId].info.name;
    };

    /**
     * Returns the features that are included in a DOM standard.
     *
     * @param {string} standardId
     *   The unique, constant identifier for a DOM standard.
     *
     * @return {?Array.string}
     *   Undefined if the given standardId is not recognized, otherwise
     *   an array of strings, each depicting a keypath to a feature in the DOM.
     */
    const featuresForStandardId = standardId => {
        if (standardsDefinitions[standardId] === undefined) {
            return undefined;
        }
        return standardsDefinitions[standardId].features;
    };

    /**
     * Returns the URL where the standard definition can be found.
     *
     * @param {string} standardId
     *   The unique, constant identifier for a DOM standard.
     *
     * @return {?string}
     *   Undefined if the given standardId is not recognized, otherwise
     *   a string representation of the URL where the standard definition can
     *   be found.  If there is no documentation for this standard (e.g.
     *   the non-standard catch all "standard") this will also be undefined.
     */
    const urlForStandardId = standardId => {
        if (standardsDefinitions[standardId] === undefined) {
            return undefined;
        }
        return standardsDefinitions[standardId].info.url;
    };

    /**
     * Returns the name of the category this standard belongs to.
     *
     * @see add-on/lib/categories.js
     *
     * @param {string} standardId
     *   The unique, constant identifier for a DOM standard.
     *
     * @return {?string}
     *   Undefined if the given standardId is not recognized, otherwise
     *   the unique identifier for a category.
     */
    const categoryIdForStandardId = standardId => {
        if (standardsDefinitions[standardId] === undefined) {
            return undefined;
        }
        return standardsDefinitions[standardId].catId;
    };

    // Reverse index standardIds by categories.
    const catIdToStandardIdMapping = allStandardIds()
        .reduce((collection, standardId) => {
            const standardDefinition = standardsDefinitions[standardId];
            const catId = standardDefinition.info.catId;

            if (collection[catId] === undefined) {
                collection[catId] = [];
            }

            collection[catId].push(standardId);
            return collection;
        }, {});

    /**
     * Returns an array of standard ids for the given category.
     *
     * @see add-on/lib/categories.js
     *
     * @param {string} categoryId
     *   The identifier for a category.
     *
     * @return {?Array.string}
     *   An array of zero or more strings, each an id for a DOM standard,
     *   or undefined if the given category id is not recognized.
     */
    const standardIdsForCategoryId = categoryId => catIdToStandardIdMapping[categoryId];

    /**
     * Sorts two standards based on their name, but identified by their id.
     *
     * @param {string} standardIdA
     *   The unique identifier for a standard.
     * @param {string} standardIdB
     *   The unique identifier for another standard.
     *
     * @return {number}
     *   An integer, of the type returned by String.prototype.localeCompare.
     */
    const sortStandardsById = (standardIdA, standardIdB) => {
        const standardNameA = nameForStandardId(standardIdA);
        const standardNameB = nameForStandardId(standardIdB);
        return standardNameA.localeCompare(standardNameB);
    };

    window.WEB_API_MANAGER.standardsLib = {
        allStandardIds,
        standardIdForFeature,
        nameForStandardId,
        featuresForStandardId,
        urlForStandardId,
        categoryIdForStandardId,
        standardIdsForCategoryId,
        sortStandardsById,
    };
}());

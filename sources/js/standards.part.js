// This code is injected into the programatically generated
// add-ons/lib/standards.js file by the gulp build process.  It creates
// getter and setters around the standards definition.
(function () {
    const {standardsDefinitions} = window.WEB_API_MANAGER.standardsLib;
    delete window.WEB_API_MANAGER.standardsLib.standardsDefinitions;

    /**
     * Returns an array of all of the standard ids defined in the extension.
     *
     * @return {Array.number}
     *   An array of standard ids.
     */
    const allStandardIds = () => Object.keys(standardsDefinitions).map(strId => +strId);

    // Build a mapping of features to standard names, given the initial
    // mapping of standards to features.
    const featureToStandardIdMapping = Object.entries(standardsDefinitions)
        .reduce((collection, value) => {
            const [standardId, standardDefinition] = value;
            standardDefinition.methods
                .concat(standardsDefinitions.properties)
                .forEach(featureName => {
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
     * @return {?number}
     *   Either the id for the standard that defines the given feature,
     *   or undefined if the feature name is not recognized.
     */
    const standardIdForFeature = featureName => featureToStandardIdMapping[featureName];

    /**
     * Returns the human readable name of a standard, from its unique identifier.
     *
     * @param {number} standardId
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
     * Returns the methods that are defined in a DOM standard.
     *
     * @param {number} standardId
     *   The unique, constant identifier for a DOM standard.
     *
     * @return {?Array.string}
     *   Undefined if the given standardId is not recognized, otherwise
     *   an array of strings, each depicting a keypath to a method in the DOM.
     */
    const methodsForStandardId = standardId => {
        if (standardsDefinitions[standardId] === undefined) {
            return undefined;
        }
        return standardsDefinitions[standardId].methods;
    };

    /**
     * Returns the properties that are defined in a DOM standard.
     *
     * @param {number} standardId
     *   The unique, constant identifier for a DOM standard.
     *
     * @return {?Array.string}
     *   Undefined if the given standardId is not recognized, otherwise
     *   an array of strings, each depicting a keypath to a property in the DOM.
     */
    const propertiesForStandardId = standardId => {
        if (standardsDefinitions[standardId] === undefined) {
            return undefined;
        }
        return standardsDefinitions[standardId].methods;
    };

    /**
     * Returns the URL where the standard definition can be found.
     *
     * @param {number} standardId
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
     * @param {number} standardId
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
     * @return {?Array.number}
     *   An array of zero or more numbers, each an id for a DOM standard,
     *   or undefined if the given category id is not recognized.
     */
    const standardIdsForCategoryId = categoryId => catIdToStandardIdMapping[categoryId];

    /**
     * Sorts two standards based on their name, but identified by their id.
     *
     * @param {number} standardIdA
     *   The unique identifier for a standard.
     * @param {number} standardIdB
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

    /**
     * Retrieves the new, number style id for a standard, given the old
     * string style id for a standard.
     *
     * Implementation wise, this is just giving the `info.id` value for a
     * standard, given its `info.origId` value. For the small number of
     * standards that used a couple of other identifiers before standardizing
     * on things, this also checks the `otherLegacyIds` field in the
     * standards definition (when it exists).
     *
     * @param {string} oldStdId
     *   The old, string style id for a standard.
     *
     * @return {?number}
     *   Either the new number id for the standard, or undefined if the given
     *   string id doesn't match a known standard id.
     */
    const newIdForOldStandardId = oldStdId => {
        const matchingDef = Object.values(standardsDefinitions).find(stdDef => {
            if (stdDef.info.origId === oldStdId) {
                return true;
            }

            if (stdDef.info.otherLegacyIds !== undefined &&
                    stdDef.info.otherLegacyIds.indexOf(oldStdId) !== -1) {
                return true;
            }

            return false;
        });

        if (matchingDef === undefined) {
            return undefined;
        }

        return matchingDef.info.id;
    };

    /**
     * Returns an array of all methods known to the extension.
     *
     * @return {Array.FeaturePath}
     *   An array of FeaturePath objects (strings), each describing the
     *   key path to a method in the DOM.
     */
    const allMethods = () => {
        const methods = Object.values(standardsDefinitions)
            .reduce((collection, standard) => {
                return collection.concat(standard.methods);
            }, []);
        return Array.from(new Set(methods));
    };

    /**
     * Returns an array of all properties known to the extension.
     *
     * @return {Array.FeaturePath}
     *   An array of FeaturePath objects (strings), each describing the
     *   key path to a method in the DOM.
     */
    const allProperties = () => {
        const properties = Object.values(standardsDefinitions)
            .reduce((collection, standard) => {
                return collection.concat(standard.properties);
            }, []);
        return Array.from(new Set(properties));
    };

    /**
     * Returns an array of every feature known to the extension.
     *
     * @return {Array.FeaturePath}
     *   An array of FeaturePath objects (strings), each describing the
     *   key path to a feature in the DOM.
     */
    const allFeatures = () => {
        const features = Object.values(standardsDefinitions)
            .reduce((collection, standard) => {
                return collection.concat(standard.features).concat(standard.methods);
            }, []);
        return Array.from(new Set(features));
    };

    window.WEB_API_MANAGER.standardsLib = {
        allStandardIds,
        standardIdForFeature,
        nameForStandardId,
        methodsForStandardId,
        propertiesForStandardId,
        urlForStandardId,
        categoryIdForStandardId,
        standardIdsForCategoryId,
        sortStandardsById,
        newIdForOldStandardId,
        allMethods,
        allProperties,
        allFeatures,
    };
}());

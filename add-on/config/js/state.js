(function () {
    "use strict";

    const {constants, browserLib, blockRulesLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();
    const defaultPattern = constants.defaultPattern;

    const arrayStrsToNums = arrayStrs => arrayStrs.map(str => +str);

    const validUpdateOperations = new Set(["delete", "add", "update"]);
    /**
     * Sends a message to the background process that the user's rule
     * preferences have been changed.
     *
     * @param {string} operation
     *   One of the following strings, describing the change that should be
     *   made to the user's preferences: "delete", "add", "update".
     * @param {BlockRule} rule
     *   The rule that is being modified (whether that rule is being updated,
     *   deleted or added).
     *
     * @return {undefined}
     */
    const notifyBackgroundProcessOfRuleChange = (operation, rule) => {
        if (validUpdateOperations.has(operation) === false) {
            throw `Invalid background operation specified: '${operation}'`;
        }
        rootObject.runtime.sendMessage(["updatePreferenceRules", {
            operation,
            ruleJSON: rule.toJSON(),
        }]);
    };

    /**
     * Sends a message to the background script, telling that "true" version
     * of the user's preferences that the user has changed their "shouldLog"
     * setting.
     *
     * @param {boolean} shouldLog
     *   Whether the user wants to log blocked functionality.
     *
     * @return {undefined}
     */
    const updateBackgroundProcessOfShouldLogChange = shouldLog => {
        rootObject.runtime.sendMessage(["updatePreferencesShouldLog", {
            shouldLog,
        }]);
    };

    /**
     * Sends a message to the background script, telling that "true" version
     * of the user's preferences that the user has changed their
     * "block cross frame"  setting.
     *
     * @param {boolean} blockCrossFrame
     *   Whether the user wants to block cross-frame access.
     *
     * @return {undefined}
     */
    const updateBackgroundProcessOfBlockCrossFrameChange = blockCrossFrame => {
        rootObject.runtime.sendMessage(["updatePreferencesBlockCrossFrame", {
            blockCrossFrame,
        }]);
    };

    /**
     * Sends a message to the background script that the user's template value
     * has been updated.
     *
     * @param {BlockRule} templateRule
     *   A blocking rule, depicting the template rule stored in preferences.
     *
     * @return {undefined}
     */
    const notifyBackgroundProcessOfTemplateChange = templateRule => {
        rootObject.runtime.sendMessage(["updatePreferencesTemplate", {
            templateRuleJSON: templateRule.toJSON(),
        }]);
    };

    /**
     * Sends a message to the background script that the user has changed
     * the pattern that an existing rule reffers to.
     *
     * @param {MatchPattern} currentPattern
     *   The match pattern to be replaced (i.e. the match pattern for the rule
     *   that is having it's match pattern updated).
     * @param {MatchPattern} newPattern
     *   The new pattern that should replace the current pattern, in the
     *   rule with the `currentPattern` pattern.
     *
     * @return {undefined}
     */
    const updateBackgroundProcessOfPatternChange = (currentPattern, newPattern) => {
        rootObject.runtime.sendMessage(["updatePreferencesReplacePattern", {
            currentPattern,
            newPattern,
        }]);
    };

    const init = preferences => {
        const state = Object.create(null);
        const defaultRule = preferences.getDefaultRule();
        state.dataSelectedPattern = defaultPattern;
        state.dataCurrentStandardIds = defaultRule.getStandardIds();
        state.dataPatterns = preferences.getAllRules().map(rule => rule.getPattern()).sort();
        state.dataShouldLog = preferences.getShouldLog();
        state.dataCurrentCustomBlockedFeatures = defaultRule.getCustomBlockedFeatures().join("\n");

        state.dataAllowingAllPatterns = preferences.getAllRules()
            .filter(rule => rule.isBlockingAnyFeatures() === false)
            .map(rule => rule.getPattern());
        state.dataBlockingAnyPatterns = preferences.getAllRules()
            .filter(rule => rule.isBlockingAnyFeatures() === true)
            .map(rule => rule.getPattern());

        const templateRule = preferences.getTemplateRule();
        state.dataTemplateStandards = templateRule.getStandardIds();
        state.dataTemplateCustomBlockedFeatures = templateRule.getCustomBlockedFeatures();

        state.dataBlockCrossFrame = preferences.getBlockCrossFrame();
        state.preferences = preferences;
        return state;
    };

    const getCurrentRule = state => {
        return state.preferences.getRuleForPattern(state.dataSelectedPattern);
    };

    const resyncWithPrefs = state => {
        const templateRule = state.preferences.getTemplateRule();
        state.dataTemplateStandards = templateRule.getStandardIds();
        state.dataTemplateCustomBlockedFeatures = templateRule.getCustomBlockedFeatures();

        state.dataPatterns = state.preferences.getAllRules().map(rule => rule.getPattern()).sort();
        const currentRule = getCurrentRule(state);
        state.dataCurrentStandardIds = currentRule.getStandardIds();
        state.dataShouldLog = state.preferences.getShouldLog();
        state.dataCurrentCustomBlockedFeatures = currentRule.getCustomBlockedFeatures().join("\n");
        state.dataBlockCrossFrame = state.preferences.getBlockCrossFrame();
        state.dataAllowingAllPatterns = state.preferences.getAllRules()
            .filter(rule => rule.isBlockingAnyFeatures() === false)
            .map(rule => rule.getPattern());
        state.dataBlockingAnyPatterns = state.preferences.getAllRules()
            .filter(rule => rule.isBlockingAnyFeatures() === true)
            .map(rule => rule.getPattern());
    };

    const setSelectedPattern = (state, newPattern) => {
        state.dataSelectedPattern = newPattern;
        resyncWithPrefs(state);
    };

    const patternsBlockingNoStandards = state => {
        return state.preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length === 0)
            .map(rule => rule.getPattern())
            .sort();
    };

    const patternsBlockingStandards = state => {
        return state.preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length > 0)
            .map(rule => rule.getPattern())
            .sort();
    };

    const setTemplateData = (state, standardIds, customBlockedFeatures) => {
        const templateRule = state.preferences.getTemplateRule();
        templateRule.setStandardIds(standardIds);
        templateRule.setCustomBlockedFeatures(customBlockedFeatures);
        state.preferences.setTemplateRule(templateRule);
        resyncWithPrefs(state);
        notifyBackgroundProcessOfTemplateChange(templateRule);
    };

    const setCurrentStandardIds = (state, standardIds) => {
        state.preferences.upcertRuleStandardIds(
            state.dataSelectedPattern,
            arrayStrsToNums(standardIds)
        );
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync.
        notifyBackgroundProcessOfRuleChange("update", getCurrentRule(state));
    };

    const deletePattern = (state, pattern) => {
        // If we're deleted the domain thats currently selected, then
        // select the default domain.
        if (state.dataSelectedPattern === pattern) {
            state.dataSelectedPattern = constants.defaultPattern;
        }
        const ruleToDelete = state.preferences.getRuleForPattern(pattern);
        state.preferences.deleteRuleForPattern(pattern);
        // Notify background process to keep preferences in sync
        resyncWithPrefs(state);
        notifyBackgroundProcessOfRuleChange("delete", ruleToDelete);
    };

    const addPattern = (state, pattern) => {
        state.dataSelectedPattern = pattern;
        state.preferences.addRule(blockRulesLib.init(pattern));
        // Notify background process to keep preferences in sync
        resyncWithPrefs(state);
        notifyBackgroundProcessOfRuleChange("add", getCurrentRule(state));
    };

    const setShouldLog = (state, shouldLog) => {
        state.preferences.setShouldLog(shouldLog);
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync
        updateBackgroundProcessOfShouldLogChange(shouldLog);
    };

    const setStandardIdsForPattern = (state, pattern, standardIds) => {
        state.preferences.upcertRuleStandardIds(pattern, arrayStrsToNums(standardIds));
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync
        notifyBackgroundProcessOfRuleChange("update", state.preferences.getRuleForPattern(pattern));
    };

    const setBlockCrossFrame = (state, blockCrossFrame) => {
        state.preferences.setBlockCrossFrame(blockCrossFrame);
        resyncWithPrefs(state);
        updateBackgroundProcessOfBlockCrossFrameChange(state.preferences.getBlockCrossFrame());
    };

    const setCustomBlockedFeatures = (state, customBlockedFeatures) => {
        state.preferences.upcertRuleCustomBlockedFeatures(
            state.dataSelectedPattern,
            customBlockedFeatures
        );
        resyncWithPrefs(state);
        notifyBackgroundProcessOfRuleChange("update", getCurrentRule(state));
    };

    const changePatternForRule = (state, newPattern, replacedPattern) => {
        const prefs =  state.preferences;

        const replacedRule = prefs.getRuleForPattern(replacedPattern);
        if (replacedRule === undefined) {
            throw `Attempting to replace rule with pattern '${replacedPattern}' with '${newPattern}', but could not find existing rule.`;
        }

        prefs.deleteRuleForPattern(replacedPattern);
        replacedRule.setPattern(newPattern);
        prefs.addRule(replacedRule);

        state.dataSelectedPattern = newPattern;
        resyncWithPrefs(state);
        updateBackgroundProcessOfPatternChange(replacedPattern, newPattern);
    };

    window.WEB_API_MANAGER.stateLib = {
        init,
        resyncWithPrefs,
        setSelectedPattern,
        patternsBlockingNoStandards,
        patternsBlockingStandards,
        setTemplateData,
        setCurrentStandardIds,
        deletePattern,
        addPattern,
        setShouldLog,
        setStandardIdsForPattern,
        setBlockCrossFrame,
        setCustomBlockedFeatures,
        changePatternForRule,
    };
}());

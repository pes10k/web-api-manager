(function () {
    "use strict";

    const {constants, browserLib} = window.WEB_API_MANAGER;
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
    const notifyBackgroundProcessOfNewRules = (operation, rule) => {
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
     * @param {Array.number} template
     *   An array of standard ids that are the users new template of standards
     *   to block.
     *
     * @return {undefined}
     */
    const notifyBackgroundProcessOfTemplateChange = template => {
        rootObject.runtime.sendMessage(["updatePreferencesTemplate", {
            template,
        }]);
    };

    const init = preferences => {
        const state = Object.create(null);
        state.dataSelectedPattern = defaultPattern;
        state.dataCurrentStandardIds = preferences.getDefaultRule().getStandardIds();
        state.dataPatterns = preferences.getAllRules().map(rule => rule.pattern).sort();
        state.dataShouldLog = preferences.getShouldLog();
        state.dataAllowingAllPatterns = preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length === 0)
            .map(rule => rule.pattern);
        state.dataBlockingAnyPatterns = preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length !== 0)
            .map(rule => rule.pattern);
        state.dataTemplate = preferences.getTemplate();
        state.dataBlockCrossFrame = preferences.getBlockCrossFrame();
        state.preferences = preferences;
        return state;
    };

    const getCurrentRule = state => {
        return state.preferences.getRuleForPattern(state.dataSelectedPattern);
    };

    const resyncWithPrefs = state => {
        state.dataTemplate = state.preferences.getTemplate();
        state.dataPatterns = state.preferences.getAllRules().map(rule => rule.pattern).sort();
        const currentRule = getCurrentRule(state);
        state.dataCurrentStandardIds = currentRule.getStandardIds();
        state.dataShouldLog = state.preferences.getShouldLog();
        state.dataBlockCrossFrame = state.preferences.getBlockCrossFrame();
        state.dataAllowingAllPatterns = state.preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length === 0)
            .map(rule => rule.pattern);
        state.dataBlockingAnyPatterns = state.preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length !== 0)
            .map(rule => rule.pattern);
    };

    const setSelectedPattern = (state, newPattern) => {
        state.dataSelectedPattern = newPattern;
        resyncWithPrefs(state);
    };

    const patternsBlockingNoStandards = state => {
        return state.preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length === 0)
            .map(rule => rule.pattern)
            .sort();
    };

    const patternsBlockingStandards = state => {
        return state.preferences.getAllRules()
            .filter(rule => rule.getStandardIds().length > 0)
            .map(rule => rule.pattern)
            .sort();
    };

    const setTemplate = (state, standardIds) => {
        state.preferences.setTemplate(standardIds);
        resyncWithPrefs(state);
        notifyBackgroundProcessOfTemplateChange(standardIds);
    };

    const setCurrentStandardIds = (state, standardIds) => {
        state.preferences.upcertRule(state.dataSelectedPattern, arrayStrsToNums(standardIds));
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync.
        notifyBackgroundProcessOfNewRules("update", getCurrentRule(state));
    };

    const deletePattern = (state, pattern) => {
        // If we're deleted the domain thats currently selected, then
        // select the default domain.
        if (state.dataSelectedPattern === pattern) {
            state.dataSelectedPattern = constants.defaultPattern;
        }
        const ruleToDelete = state.preferences.getRuleForPattern(pattern);
        state.preferences.deleteRule(pattern);
        // Notify background process to keep preferences in sync
        resyncWithPrefs(state);
        notifyBackgroundProcessOfNewRules("delete", ruleToDelete);
    };

    const addPattern = (state, pattern, standardIds = []) => {
        state.dataSelectedPattern = pattern;
        state.preferences.upcertRule(pattern, arrayStrsToNums(standardIds));
        // Notify background process to keep preferences in sync
        resyncWithPrefs(state);
        notifyBackgroundProcessOfNewRules("add", getCurrentRule(state));
    };

    const setShouldLog = (state, shouldLog) => {
        state.preferences.setShouldLog(shouldLog);
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync
        updateBackgroundProcessOfShouldLogChange(shouldLog);
    };

    const setStandardIdsForPattern = (state, pattern, standardIds) => {
        state.preferences.upcertRule(pattern, arrayStrsToNums(standardIds));
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync
        notifyBackgroundProcessOfNewRules("update", state.preferences.getRuleForPattern(pattern));
    };

    const setBlockCrossFrame = (state, blockCrossFrame) => {
        state.preferences.setBlockCrossFrame(blockCrossFrame);
        resyncWithPrefs(state);
        updateBackgroundProcessOfBlockCrossFrameChange(state.preferences.getBlockCrossFrame());
    };

    window.WEB_API_MANAGER.stateLib = {
        init,
        resyncWithPrefs,
        setSelectedPattern,
        patternsBlockingNoStandards,
        patternsBlockingStandards,
        setTemplate,
        setCurrentStandardIds,
        deletePattern,
        addPattern,
        setShouldLog,
        setStandardIdsForPattern,
        setBlockCrossFrame,
    };
}());

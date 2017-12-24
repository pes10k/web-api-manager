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
    const updateBackgroundPreference = (operation, rule) => {
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
    const updateBackgroundShouldLog = shouldLog => {
        rootObject.runtime.sendMessage(["updatePreferencesShouldLog", {
            shouldLog,
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
        state.preferences = preferences;

        return state;
    };

    const getCurrentRule = state => {
        return state.preferences.getRuleForPattern(state.dataSelectedPattern);
    };

    const resyncWithPrefs = state => {
        state.dataPatterns = state.preferences.getAllRules().map(rule => rule.pattern).sort();
        const currentRule = getCurrentRule(state);
        state.dataCurrentStandardIds = currentRule.getStandardIds();
        state.dataShouldLog = state.preferences.getShouldLog();
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

    const setCurrentStandardIds = (state, standardIds) => {
        state.preferences.upcertRule(state.dataSelectedPattern, arrayStrsToNums(standardIds));
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync.
        updateBackgroundPreference("update", getCurrentRule(state));
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
        updateBackgroundPreference("delete", ruleToDelete);
    };

    const addPattern = (state, pattern, standardIds = []) => {
        state.dataSelectedPattern = pattern;
        state.preferences.upcertRule(pattern, arrayStrsToNums(standardIds));
        // Notify background process to keep preferences in sync
        resyncWithPrefs(state);
        updateBackgroundPreference("add", getCurrentRule(state));
    };

    const setShouldLog = (state, shouldLog) => {
        state.preferences.setShouldLog(shouldLog);
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync
        updateBackgroundShouldLog(shouldLog);
    };

    const setStandardIdsForPattern = (state, pattern, standardIds) => {
        state.preferences.upcertRule(pattern, arrayStrsToNums(standardIds));
        resyncWithPrefs(state);
        // Notify background process to keep preferences in sync
        updateBackgroundPreference("update", state.preferences.getRuleForPattern(pattern));
    };

    window.WEB_API_MANAGER.stateLib = {
        init,
        resyncWithPrefs,
        setSelectedPattern,
        patternsBlockingNoStandards,
        patternsBlockingStandards,
        setCurrentStandardIds,
        deletePattern,
        addPattern,
        setShouldLog,
        setStandardIdsForPattern,
    };
}());

(function () {
    "use strict";

    const {constants} = window.WEB_API_MANAGER;
    const defaultPattern = constants.defaultPattern;

    const generateStateObject = preferences => {
        const state = Object.create(null);
        state.dataSelectedPattern = defaultPattern;
        state.dataCurrentStandardIds = preferences.getDefaultRule().getStandardIds();
        state.dataPatterns = preferences.getRuleForPattern(defaultPattern).getStandardIds();
        state.dataShouldLog = preferences.getShouldLog();

        state.preferences = preferences;

        state.resyncWithPrefs = function () {
            this.dataPatterns = preferences.getAllRules().map(rule => rule.pattern);
            const currentRule = preferences.getRuleForPattern(this.dataSelectedPattern);
            this.dataCurrentStandardIds = currentRule.getStandardIds();
            console.log([this.dataSelectedPattern, this.dataCurrentStandardIds]);
            this.dataShouldLog = preferences.getShouldLog();
        };

        state.setSelectedPattern = function (newPattern) {
            this.dataSelectedPattern = newPattern;
            this.resyncWithPrefs();
        };

        state.patternsBlockingNoStandards = () => {
            return preferences.getAllRules()
                .filter(rule => rule.getStandardIds().length === 0)
                .map(rule => rule.pattern)
                .sort();
        };

        state.patternsBlockingStandards = () => {
            return preferences.getAllRules()
                .filter(rule => rule.getStandardIds().length > 0)
                .map(rule => rule.pattern)
                .sort();
        };

        state.setCurrentStandardIds = function (standardIds) {
            console.log([this.dataSelectedPattern, standardIds]);
            preferences.upcertRule(this.dataSelectedPattern, standardIds);
            this.resyncWithPrefs();
            // Notify background process to keep preferences in sync
        };

        state.deletePattern = function (pattern) {
            // If we're deleted the domain thats currently selected, then
            // select the default domain.
            if (this.dataSelectedPattern === pattern) {
                this.dataSelectedPattern = constants.defaultPattern;
            }
            preferences.deleteRule(pattern);
            // Notify background process to keep preferences in sync
            this.resyncWithPrefs();
        };

        state.addPattern = function (pattern, standardIds = []) {
            this.dataSelectedPattern = pattern;
            preferences.upcertRule(pattern, standardIds);
            // Notify background process to keep preferences in sync
            this.resyncWithPrefs();
        };

        state.setShouldLog = function (shouldLog) {
            preferences.setShouldLog(shouldLog);
            this.resyncWithPrefs();
            // Notify background process to keep preferences in sync
        };

        state.setStandardIdsForPattern =function (pattern, standardIds) {
            preferences.upcertRule(pattern, standardIds);
            this.resyncWithPrefs();
            // Notify background process to keep preferences in sync
        };

        return state;
    };

    window.WEB_API_MANAGER.stateLib = {
        generateStateObject,
    };
}());

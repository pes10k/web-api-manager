// This module contains functions that *are not* executed as part of the
// node process, but injected into the browser during tests (using
// Function.prototype.toString).

"use strict";

// Returns the contents of the provided function definition source.
//
// Ex "function () { return 1; }" -> "return 1";
const stripFuncFromSource = function (source) {

    const parts = source.split("\n").filter(x => !!x.trim());
    parts.splice(0, 1);
    parts.splice(parts.length - 1, 1);
    const recreatedScript = parts.join("\n");
    return recreatedScript;
};

module.exports.temporaryAddOnInstallScript = (function () {

    const funcToInject = function () {

        const {Components, AddonManager} = window;
        let fileUtils = Components.utils.import('resource://gre/modules/FileUtils.jsm');
        let FileUtils = fileUtils.FileUtils;
        let callback = arguments[arguments.length - 1];
        Components.utils.import('resource://gre/modules/AddonManager.jsm');

        let listener = {
            onInstallEnded: function(install, addon) {
                callback([addon.id, 0]);
            },
            onInstallFailed: function(install) {
                callback([null, install.error]);
            },
            onInstalled: function(addon) {
                AddonManager.removeAddonListener(listener);
                callback([addon.id, 0]);
            }
        };

        let file = new FileUtils.File(arguments[0]);

        AddonManager.addAddonListener(listener);
        AddonManager.installTemporaryAddon(file).catch(error => {
            Components.utils.reportError(error);
            callback([null, error]);
        });
    };

    const funcSource = stripFuncFromSource(funcToInject.toString());

    return function () {
        return funcSource;
    };
}());

module.exports.setStandardsAsBlockedScript = (function () {

    const funcToInject = function () {
        const doc = window.document;
        const callback = arguments[arguments.length - 1];
        const standardsToBlockArray = "###REPLACE###";

        standardsToBlockArray.forEach(function (aStandardName) {
            const input = doc.querySelector(`input[value='${aStandardName}']`);
            input.click();
        });

        callback();
    };

    const funcSource = stripFuncFromSource(funcToInject.toString());

    return function (standardsToBlock) {
        return funcSource.replace('"###REPLACE###"', JSON.stringify(standardsToBlock));
    };
}());

module.exports.testSVGTestScript = (function () {

    const funcToInject = function () {
        const callback = arguments[arguments.length - 1];
        callback(HTMLEmbedElement.prototype.getSVGDocument.art.bart.fart());
    };

    const funcSource = stripFuncFromSource(funcToInject.toString());

    return function () {
        return funcSource;
    };
}());
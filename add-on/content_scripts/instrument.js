/*jslint es6: true, browser: true*/
/*global window*/
// This script file runs in the context of the extension, and mainly
// exists to inject the proxy blocking code into content frames.
(function () {
    "use strict";

    const cookies2 = window.Cookies.noConflict();
    const {standards, constants, cookieEncodingLib, proxyBlockLib} = window.WEB_API_MANAGER;
    const standardsCookieName = constants.cookieName;

    const doc = window.document;
    const script = doc.createElement('script');
    const rootElm = doc.head || doc.documentElement;

    const cookieValue = cookies2.get(standardsCookieName);

    if (!cookieValue) {
        window.console.log(`Unable to find the Web API Manager settings for ${doc.location.href}`);
        return;
    }

    cookies2.remove(standardsCookieName, {path: window.document.location.pathname});

    if (!cookieValue) {
        return;
    }

    const [standardsToBlock, shouldLog] = cookieEncodingLib.fromCookieValue(cookieValue);

    const [scriptToInject, scriptHash] = proxyBlockLib.generateScriptPayload(
        standards,
        standardsToBlock,
        shouldLog
    );

    script.appendChild(doc.createTextNode(scriptToInject));
    script.integrity = "sha256-" + scriptHash;
    rootElm.appendChild(script);
}());

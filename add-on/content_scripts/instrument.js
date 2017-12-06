/*global window, console*/
// This script file runs in the context of the extension, and mainly
// exists to inject the proxy blocking code into content frames.
(function () {
    "use strict";

    const consoleLog = window.console.log;
    const cookies2 = window.Cookies.noConflict();
    const {standards, constants, cookieEncodingLib, proxyBlockLib} = window.WEB_API_MANAGER;
    const standardsCookieName = constants.cookieName;

    const doc = window.document;
    const script = doc.createElement("script");
    const rootElm = doc.head || doc.documentElement;

    // First see if we can read the standards to block out of the cookie
    // sent from the extension.  If not, then try to read it out of local
    // storage (which may be needed if there are multiple requests to the same
    // domain that interleave so that the cookie is deleted by one request
    // before it can be read out by the other).
    let domainPref;

    try {
        domainPref = cookies2.get(standardsCookieName);
        cookies2.remove(standardsCookieName, {path: window.document.location.pathname});
    } catch (e) {
        // This can happen if an iframe tries to read the cookie created from
        // a parent request without the allow-same-origin attribute.
    }

    // If we couldn't read the domain preferences out of the cookie, then
    // see if we can read it out of localStorage.
    if (!domainPref) {
        if (window.localStorage) {
            domainPref = window.localStorage[standardsCookieName];
        }
    } else {
        // Otherwise, if we did read things out of the cookie, then store
        // it in local storage, so that other requests to the same origin
        // can read the blocking settings.
        window.localStorage[standardsCookieName] = domainPref;
    }

    if (!domainPref) {
        consoleLog.call(console, `Unable to find Web API Manager settings: ${doc.location.href}`);
        return;
    }

    const [standardsToBlock, shouldLog, randNonce] = cookieEncodingLib.fromCookieValue(domainPref);

    const [scriptToInject, ignore] = proxyBlockLib.generateScriptPayload(
        standards,
        standardsToBlock,
        shouldLog,
        randNonce
    );

    const eventName = "__wamEvent" + randNonce;
    doc.addEventListener(eventName, event => {
        browser.runtime.sendMessage(["blockedFeature", event.detail]);
    });

    script.appendChild(doc.createTextNode(scriptToInject));
    rootElm.appendChild(script);
}());

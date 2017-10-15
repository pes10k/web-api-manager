/*jslint es6: true, browser: true*/
/*global window, Cookies*/
// This script file runs in the context of the extension, and mainly
// exists to inject the proxy blocking code into content frames.
(function () {
    "use strict";

    const doc = window.document;
    const script = doc.createElement('script');
    const rootElm = doc.head || doc.documentElement;

    const standardsCookieKey = "wam-standards";
    const {packingLib, standards} = window.WEB_API_MANAGER;
    const options = Object.keys(standards);
    const packedValues = Cookies.get(standardsCookieKey);
    const standardsToBlock = packingLib.unpack(options, packedValues);
    Cookies.remove(standardsCookieKey);

    const shouldLogCookieKey = "wam-log";
    const shouldLog = Cookies.get(shouldLogCookieKey);
    Cookies.remove(shouldLogCookieKey);

    const code = `
        window.WEB_API_MANAGER_PAGE = {
            standards: ${JSON.stringify(standards)},
            toBlock: ${JSON.stringify(standardsToBlock)},
            shouldLog: ${shouldLog}
        };
        ###-INJECTED-PROXY-BLOCKING-CODE-###
    `;

    script.appendChild(doc.createTextNode(code));
    rootElm.appendChild(script);
}());
/*jslint es6: true, browser: true*/
/*global chrome, window, Cookies*/
// This script file runs in the context of the extension, and mainly
// exists to inject the proxy blocking code into content frames.
(function () {
    "use strict";

    const script = document.createElement('script');
    const rootElm = document.head || document.documentElement;

    const cookieKey = "web-api-manager";
    const {packingLib, standards} = window.WEB_API_MANAGER;
    const options = Object.keys(standards);
    const packedValues = Cookies.get(cookieKey);
    const standardsToBlock = packingLib.unpack(options, packedValues);
    Cookies.remove(cookieKey);

    const code = `
        window.WEB_API_MANAGER_PAGE = {
            standards: ${JSON.stringify(standards)},
            toBlock: ${JSON.stringify(standardsToBlock)},
            shouldLog: false
        };
        ###-INJECTED-PROXY-BLOCKING-CODE-###
    `;

    script.appendChild(document.createTextNode(code));
    rootElm.appendChild(script);
}());
/*jslint es6: true, browser: true*/
/*global chrome, window*/
// This script file runs in the context of the extension, and mainly
// exists to inject the proxy blocking code into content frames.
(function () {
    "use strict";

    let script = document.createElement('script');
    let rootElm = document.head || document.documentElement;
    let code = `
        window.WEB_API_MANAGER_PAGE = {
            standards: ${JSON.stringify(window.WEB_API_MANAGER.standards)},
            toBlock: ${JSON.stringify(window.WEB_API_MANAGER.defaults)},
            shouldLog: true
        };
        ###-INJECTED-PROXY-BLOCKING-CODE-###
    `;

    script.appendChild(document.createTextNode(code));
    rootElm.appendChild(script);
}());
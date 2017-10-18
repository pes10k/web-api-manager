/*jslint es6: true, browser: true*/
/*global window, Cookies*/
// This script file runs in the context of the extension, and mainly
// exists to inject the proxy blocking code into content frames.
(function () {
    "use strict";

    const doc = window.document;
    const script = doc.createElement('script');
    const rootElm = doc.head || doc.documentElement;
    const shouldLogValue = "shouldLog";

    const standardsCookieKey = "wam-temp-cookie";
    const {packingLib, standards} = window.WEB_API_MANAGER;
    const options = Object.keys(standards);
    const optionsWithShouldLog = options.concat([shouldLogValue]);
    const packedValues = Cookies.get(standardsCookieKey);
    const unpackedValues = packingLib.unpack(optionsWithShouldLog, packedValues);
    Cookies.remove(standardsCookieKey);

    let shouldLog;
    const standardsToBlock = unpackedValues;
    const indexOfShouldLog = unpackedValues.indexOf(shouldLogValue);

    if (indexOfShouldLog === -1) {
        shouldLog = false;
    } else {
        shouldLog = true;
        standardsToBlock.splice(indexOfShouldLog, 1);
    }

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

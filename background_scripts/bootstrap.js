/*jslint es6: true*/
/*global chrome*/
(function () {
    "use strict";
    let onMsgHandler;

    onMsgHandler = function (request, ignore, sendResponse) {

        let requestingDoman = request.domain;

        if (request.request !== "rules") {
            sendResponse(null);
            return false;
        }

        sendResponse({
            rules: ["fetch"]
        });
        return false;
    };

    chrome.runtime.peteStuff = "P";

    chrome.runtime.onMessage.addListener(onMsgHandler);
}());
(function () {
    "use strict";

    const {browserLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();
    const doc = window.document;
    const message = ["blockedFeaturesReport", undefined];

    rootObject.runtime.sendMessage(message, response => {
        const [messageType, blockingReportJSON] = response;

        if (messageType !== "blockedFeaturesReportResponse") {
            return;
        }

        const reportTextArea = doc.getElementsByTagName("textarea")[0];
        reportTextArea.value = blockingReportJSON;

        window.WEB_API_MANAGER_REPORT = {blockingReportJSON};
    });
}());

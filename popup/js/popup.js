/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";

    const rootObject = window.browser || window.chrome;
    const doc = window.document;
    const configureButton = doc.getElementById("config-page-link");

    configureButton.addEventListener("click", function (event) {
        rootObject.runtime.openOptionsPage();
        event.preventDefault();
        event.stopImmediatePropagation();
    }, false);

    rootObject.tabs.executeScript(
        {
            allFrames: true,
            code: "window.location.host"
        },
        function (response) {

            const uniqueDomains = Array.from(new Set(response)).sort();
            const message = ["rulesForDomains", uniqueDomains];
            rootObject.runtime.sendMessage(message, function (response) {

                const listGroupElm = doc.querySelector("ul.list-group");
                const domainNames = Object.keys(response);

                domainNames.forEach(function (aDomain) {
                    const domainRule = response[aDomain];

                    const liElm = doc.createElement("li");
                    liElm.className = "list-group-item";
                    if (domainRule !== "(default)") {
                        liElm.className += " list-group-item-success";
                    }

                    const spanElm = doc.createElement("span");
                    spanElm.className = "badge";

                    const badgeText = doc.createTextNode(domainRule);
                    spanElm.appendChild(badgeText);
                    liElm.appendChild(spanElm);

                    const textElm = doc.createTextNode(aDomain);
                    liElm.appendChild(textElm);
                    listGroupElm.appendChild(liElm);
                });
            });
        }
    );
}());
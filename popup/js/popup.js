/*jslint es6: true*/
/*global window*/
(function () {
    const rootObject = window.browser || window.chrome;
    const configureButton = window.document.getElementById("config-page-link");

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

                const listGroupElm = document.querySelector("ul.list-group");
                const domainNames = Object.keys(response);

                domainNames.forEach(function (aDomain) {
                    const domainRule = response[aDomain];
                    
                    const liElm = document.createElement("li");
                    liElm.className = "list-group-item";
                    if (domainRule !== "(default)") {
                        liElm.className += " list-group-item-success";
                    }

                    const spanElm = document.createElement("span");
                    spanElm.className = "badge";

                    const badgeText = document.createTextNode(domainRule);
                    spanElm.appendChild(badgeText);
                    liElm.appendChild(spanElm);

                    const textElm = document.createTextNode(aDomain);
                    liElm.appendChild(textElm);
                    listGroupElm.appendChild(liElm);
                });
            });
        }
    );
}());
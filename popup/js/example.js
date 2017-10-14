(function () {
    const rootObject = window.browser || window.chrome;

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
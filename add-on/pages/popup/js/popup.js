/*global window*/
(function () {
    "use strict";

    const {browserLib, constants, preferencesLib} = window.WEB_API_MANAGER;
    const rootObject = browserLib.getRootObject();
    const doc = window.document;
    const configureButton = doc.getElementById("config-page-link");
    const reportButton = doc.getElementById("report-page-link");
    const rulesTableBody = doc.querySelector("#rules-table tbody");
    const defaultPattern = constants.defaultPattern;

    /**
     * Returns a function for use as the "onclick" handler for a toggle button.
     *
     * @param {string} hostName
     *   The name of the host to change the blocking settings for.
     * @param {string} action
     *   Either "allow" (indicating that all APIs should be allowed for this
     *   host) or "block" (indicating that all APIs should be blocked for
     *   this host).
     *
     * @return {function}
     *   A function that takes a single event object as an argument.  For
     *   use as an event handler callback.
     */
    const createOnToggleHandler = function (hostName, action) {
        const onClickHandler = function (event) {
            const message = ["toggleBlocking", {
                "action": action,
                "hostName": hostName,
            }];
            const button = event.target;
            const containingRowElm = button.parentNode.parentNode;

            const appliedRuleTd = containingRowElm.querySelector("td:nth-child(2)");
            const numApisBlockedTd = containingRowElm.querySelector("td:nth-child(3)");

            button.className += " disabled";
            button.innerHtml = "setting…";

            rootObject.runtime.sendMessage(message, responseMessage => {
                const [messageType, numAPIsBlocked] = responseMessage;

                if (messageType === "toggleBlockingResponse") {
                    numApisBlockedTd.innerText = numAPIsBlocked;

                    if (action === "block") {
                        appliedRuleTd.innerText = defaultPattern;
                    } else if (action === "allow") {
                        appliedRuleTd.innerText = hostName;
                    }

                    button.innerText = "👍";
                }
            });

            event.preventDefault();
            event.stopImmediatePropagation();
        };

        return onClickHandler;
    };

    /**
     * Generates a TR element based on a domain's blocking status
     *
     * @param {string} domainName
     *   The name of a domain of a frame on the current tab
     * @param {string} appliedRuleName
     *   The pattern matching rule for the rule set applied (or,
     *   if no matching rule "(default)").
     * @param {number} numAPIsBlocked
     *   The number of APIs blocked for this domain.
     *
     * @return {Node}
     *   a HTMLTRElement object.
     */
    const ruleToTr = function (domainName, appliedRuleName, numAPIsBlocked) {
        const trElm = doc.createElement("tr");

        const domainTd = doc.createElement("td");
        const domainTdText = doc.createTextNode(domainName);
        domainTd.appendChild(domainTdText);
        trElm.appendChild(domainTd);

        const ruleTd = doc.createElement("td");
        ruleTd.appendChild(doc.createTextNode(appliedRuleName));
        trElm.appendChild(ruleTd);

        const numBlockedTd = doc.createElement("td");
        numBlockedTd.appendChild(doc.createTextNode(numAPIsBlocked));
        trElm.appendChild(numBlockedTd);

        const actionsTd = doc.createElement("td");
        const toggleButton = doc.createElement("button");
        toggleButton.className = "btn btn-default btn-xs block-toggle";

        const isAllowingAll = numAPIsBlocked === 0;

        let toggleButtonText;
        let toggleAction;

        // If the domain is using the default rule, and the default rule is
        // allowing all API's then do nothing, since there is no sensible
        // option to "toggle" to.
        if (isAllowingAll === false) {
            toggleButtonText = "allow all";
            toggleButton.className += " success";
            toggleAction = "allow";
        } else {
            toggleButtonText = "remove grant";
            toggleButton.className += " warn";
            toggleAction = "block";
        }

        if (toggleButtonText !== undefined) {
            const toggleButtonTextElm = doc.createTextNode(toggleButtonText);
            toggleButton.appendChild(toggleButtonTextElm);

            if (toggleAction !== undefined) {
                const onClickToggleButton = createOnToggleHandler(domainName, toggleAction);
                toggleButton.addEventListener("click", onClickToggleButton, false);
            }
        }

        actionsTd.appendChild(toggleButton);
        trElm.appendChild(actionsTd);

        return trElm;
    };

    configureButton.addEventListener("click", event => {
        rootObject.runtime.openOptionsPage();
        event.preventDefault();
        event.stopImmediatePropagation();
    }, false);

    reportButton.addEventListener("click", event => {
        rootObject.runtime.sendMessage(["openReportPage", undefined]);
        event.preventDefault();
        event.stopImmediatePropagation();
    });

    const executeScriptCallback = executeScriptResponse => {
        const uniqueHosts = Array.from(new Set(executeScriptResponse)).sort();
        const message = ["getPreferences", undefined];

        rootObject.runtime.sendMessage(message, response => {
            const [label, data] = response;
            if (label !== "getPreferencesResponse") {
                return;
            }
            doc.body.className = "loaded";

            const preferences = preferencesLib.fromJSON(data);

            uniqueHosts.forEach(aHost => {
                const blockRule = preferences.getRuleForUrl(aHost);
                const stdIdsForRule = blockRule.getStandardIds();
                const rowElm = ruleToTr(aHost, blockRule.pattern, stdIdsForRule.length);
                rulesTableBody.appendChild(rowElm);
            });

            if (preferences.getShouldLog() === true) {
                reportButton.className = reportButton.className.replace(" hidden", "");
            }
        });
    };

    const injectedScript = {
        allFrames: true,
        code: "window.location.host",
    };

    rootObject.tabs.executeScript(injectedScript, executeScriptCallback);
}());

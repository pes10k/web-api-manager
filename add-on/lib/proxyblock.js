/*globals sjcl*/
// This module generates JavaScript code for instrumenting the DOM
// to prevent pages from accessing Web API standards.  This code
// is generated programmatically so that both the background and content
// scripts can determine the SHA256 hash of the injected code, so that
// we can set the CSP policy as needed.
(function () {
    "use strict";

    const {standardsLib, enums} = window.WEB_API_MANAGER;

    // This function is what does the instrumenting of the DOM,
    // based on values set in the global window.WEB_API_MANAGER_PAGE
    // structure.  This function is never called, but is rendered to
    // a string (with Function.prototype.toString) and inserted into
    // content scripts.  Its written here as a proper function
    // just to make it easier to write and deploy (ie vim highlights
    // it just like any other JS).
    const proxyBlockingFunction = function () {
        // Grab references to console.log and Document.prototype.dispatchEvent
        // before the page can get to it, to prevent the page from interacting
        // with recording what standards are blocked / logged.
        const consoleLog = console.log;
        const dispatchEvent = document.dispatchEvent;
        const doc = window.document;

        const {shouldLog, blockCrossFrame, randNonce} = window.WEB_API_MANAGER_PAGE;

        // Prevent ambiguity from shadowing the module's enum's property.
        const localEnums = window.WEB_API_MANAGER_PAGE.enums;

        let {featuresToBlock} = window.WEB_API_MANAGER_PAGE;
        const {customBlockedFeatures} = window.WEB_API_MANAGER_PAGE;

        // Its possible that the Web API removal code will block direct references
        // to the following methods, so grab references to them before the
        // DOM is instrumented (and their references are possibly blocked).
        const removeChild = window.Element.prototype.removeChild;
        const getElementsByTagName = window.document.getElementsByTagName;

        // This function removes the script tag containing this script
        // from the page, and removes any variables injected into the page.
        // This is done to make it more difficult for the modified page
        // to detect the modifications / this extension/
        const removeSelfFromPage = () => {
            // Delete the WEB_API_MANAGER_PAGE global property.  Technically
            // this never needed to be global, but doing so allows for easier
            // linting of the code, makes things easier to understand (for me
            // at least) and doesn't have any side effect as long as we delete
            // it when we're done, and before the page scripts can start running.
            delete window.WEB_API_MANAGER_PAGE;

            // Next, remove the script tag containing this code from the document,
            // so that the structure of the page looks like what the page author
            // expects / intended.
            const scriptTags = getElementsByTagName.call(window.document, "script");
            const thisScript = scriptTags[0];
            removeChild.call(thisScript.parentNode, thisScript);
        };

        // If we're in passive mode, then we want to "block" (which in
        // passive mode really just means 'log and allow') every feature.
        // Otherwise, only interpose on the features specified by the
        // user for this domain / match pattern.  The
        // `window.WEB_API_MANAGER_PAGE.allFeatures` property is only set
        // if the script was injected in passive mode.
        if (shouldLog === localEnums.ShouldLogVal.PASSIVE) {
            featuresToBlock = window.WEB_API_MANAGER_PAGE.allFeatures;
        }

        if (featuresToBlock.length === 0 && customBlockedFeatures.length === 0) {
            removeSelfFromPage();
            return;
        }

        // Listen to events triggered from the blocking code using a randomly
        // generated nonce, so that the guest page does not know what events
        // to listen for, or what event name to spoof.
        const eventName = "__wamEvent" + randNonce;

        const defaultFunction = function () {};
        const funcPropNames = Object.getOwnPropertyNames(defaultFunction);
        const unconfigurablePropNames = funcPropNames.filter(propName => {
            const possiblePropDesc = Object.getOwnPropertyDescriptor(defaultFunction, propName);
            return (possiblePropDesc && !possiblePropDesc.configurable);
        });

        const toPrimitiveFunc = hint => {
            if (hint === "number" || hint === "default") {
                return 0;
            }
            if (hint === "string") {
                return "";
            }
            return undefined;
        };

        const keyPathToRefPath = keyPath => {
            const keyParts = keyPath.split(".");
            return keyParts.reduce(function (prev, cur) {
                if (prev === undefined) {
                    return undefined;
                }

                const numNodes = prev.length;
                const currentLeaf = (numNodes === 0)
                    ? window
                    : prev[numNodes - 1];

                const nextLeaf = currentLeaf[cur];

                if (nextLeaf === undefined) {
                    return undefined;
                }

                return prev.concat([nextLeaf]);
            }, []);
        };

        const logKeyPath = (function () {
            const loggedKeyPaths = new Set();

            return keyPath => {
                if (loggedKeyPaths.has(keyPath) === true) {
                    return;
                }
                loggedKeyPaths.add(keyPath);
                if (keyPath !== undefined && shouldLog !== localEnums.ShouldLogVal.NONE) {
                    const featureReport = {feature: keyPath};
                    const blockEvent = new window.CustomEvent(eventName, {
                        detail: featureReport,
                    });

                    dispatchEvent.call(doc, blockEvent);
                }
            };
        }());

        const createBlockingProxy = keyPath => {
            // Every time the proxy has been called 1000 times, return
            // undefined instead of the proxy object, to ensure that the
            // proxy doesn't get stuck in an infinite loop.
            let recursionGuardCounter = 0;

            const blockingProxy = new Proxy(defaultFunction, {
                get: function (ignore, property) {
                    logKeyPath(keyPath);

                    if (recursionGuardCounter === 1000) {
                        recursionGuardCounter = 0;
                        return undefined;
                    }

                    recursionGuardCounter += 1;

                    if (property === Symbol.toPrimitive) {
                        return toPrimitiveFunc;
                    }

                    if (property === "valueOf") {
                        return toPrimitiveFunc;
                    }

                    return blockingProxy;
                },
                set: function () {
                    logKeyPath(keyPath);
                    return blockingProxy;
                },
                apply: function () {
                    logKeyPath(keyPath);
                    return blockingProxy;
                },
                ownKeys: function () {
                    return unconfigurablePropNames;
                },
                has: function (ignore, property) {
                    return (unconfigurablePropNames.indexOf(property) > -1);
                },
                getOwnPropertyDescriptor: function (ignore, property) {
                    if (unconfigurablePropNames.indexOf(property) === -1) {
                        return undefined;
                    }
                    return Object.getOwnPropertyDescriptor(defaultFunction, property);
                },
            });

            return blockingProxy;
        };

        const defaultBlockingProxy = createBlockingProxy();

        const blockFeatureAtKeyPath = keyPath => {
            const propertyRefs = keyPathToRefPath(keyPath);

            // If we weren't able to turn the key path into an array of references,
            // then it means that the property doesn't exist in this DOM /
            // environment, so there is nothing to block.
            if (propertyRefs === undefined) {
                return false;
            }

            const keyPathSegments = keyPath.split(".");
            const lastPropertyName = keyPathSegments[keyPathSegments.length - 1];
            const leafRef = propertyRefs[propertyRefs.length - 1];
            const parentRef = propertyRefs[propertyRefs.length - 2];

            // At least for now, only interpose on methods.
            if (typeof leafRef !== "function") {
                return false;
            }

            try {
                switch (shouldLog) {
                    case localEnums.ShouldLogVal.NONE:
                        parentRef[lastPropertyName] = defaultBlockingProxy;
                        return true;

                    case localEnums.ShouldLogVal.STANDARD:
                        parentRef[lastPropertyName] = createBlockingProxy(keyPath);
                        return true;

                    case localEnums.ShouldLogVal.PASSIVE: {
                        const origRef = parentRef[lastPropertyName];
                        parentRef[lastPropertyName] = function () {
                            logKeyPath(keyPath);
                            return origRef.apply(this, arguments);
                        };
                        return true;
                    }
                }
            } catch (e) {
                if (shouldLog !== localEnums.ShouldLogVal.NONE) {
                    consoleLog.call(console, "Error instrumenting " + keyPath + ": " + e);
                }
                return false;
            }
        };

        // `featuresToBlock` is now an array of FeaturePath's / strings,
        // each describing the keypath of feature in the DOM to block.
        featuresToBlock.forEach(blockFeatureAtKeyPath);
        customBlockedFeatures.forEach(blockFeatureAtKeyPath);

        if (blockCrossFrame === true) {
            // Block references to the return value of the `window.open` function,
            // and the `window.opener` property, to prevent the current frame
            // from getting access to Web API functions and features that are
            // blocked in this frame, by reaching into other frames and
            // pulling them into the current context.
            //
            // This is done before (otherwise) instrumenting the DOM to block
            // the selected standards, so that the window.open function still
            // functions if the HTML standard is allowed on the page, but the return
            // value is protected (e.g. if the HTML standard is allowed, allow
            // windows to be opened with window.open, but still prevent the current
            // frame from accessing the DOM of other frames).
            //
            // @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open
            // @see https://developer.mozilla.org/en-US/docs/Web/API/Window/opener
            const origWindowOpen = window.open;
            window.open = function () {
                origWindowOpen.apply(this, arguments);
                return defaultBlockingProxy;
            };
            Object.defineProperty(window, "opener", {
                get: () => defaultBlockingProxy,
            });

            // Next, prevent access to frame's contentDocument / contentWindow
            // properties, to prevent the parent frame from pulling unblocked
            // references to blocked standards from injected frames.
            // This will break some sites, but, fingers crossed, its not too much.
            const frameTypesToModify = [HTMLIFrameElement, HTMLFrameElement];
            const propertiesToBlock = ["contentDocument", "contentWindow"];

            frameTypesToModify.forEach(frameType => {
                propertiesToBlock.forEach(propertyName => {
                    Object.defineProperty(frameType.prototype, propertyName, {
                        get: () => defaultBlockingProxy,
                    });
                });
            });
        }

        removeSelfFromPage();
    };

    /**
     * Generates a script payload, for injecting into content scripts.  The
     * generated string is 99% the above proxyBlockingFunction function,
     * but with the window.WEB_API_MANAGER_PAGE object set up
     * correctly to block the desired functions.
     *
     * @param {ProxyBlockSettings} blockingSettings
     *   Instructions on what and how the blocking script should modify the
     *   executing page.
     *
     * @return {[string, string]}
     *   Returns an array containing two values.  First, JavaScript code
     *   that instruments the DOM of page's its injected into to render the
     *   standardNamesToBlock standards un-reachable, and second, a
     *   base64 encoded sha256 hash of the code.
     */
    const generateScriptPayload = blockingSettings => {
        // Build an array of the strings, each being the keypath to
        // a feature that should be blocked.
        const featuresToBlock = blockingSettings.standardIdsToBlock
            .reduce((collection, standardId) => {
                const featuresInStandard = standardsLib.featuresForStandardId(standardId);
                collection = collection.concat(featuresInStandard);
                return collection;
            }, []);

        const injectedValues = {
            randNonce: blockingSettings.randNonce,
            featuresToBlock: featuresToBlock,
            shouldLog: blockingSettings.shouldLog,
            blockCrossFrame: blockingSettings.blockCrossFrame,
            customBlockedFeatures: blockingSettings.customBlockedFeatures,
            enums: {
                ShouldLogVal: enums.ShouldLogVal,
            },
        };

        if (blockingSettings.shouldLog === enums.ShouldLogVal.PASSIVE) {
            injectedValues.allFeatures = standardsLib.allFeatures();
        }

        const proxyBlockingSettings = `
            window.WEB_API_MANAGER_PAGE = ${JSON.stringify(injectedValues)};
        `;

        const proxyingBlockingSrc = "(" + proxyBlockingFunction.toString() + "())";
        const completeScriptCode = proxyBlockingSettings + "\n" + proxyingBlockingSrc;

        // Use the SJ Crypto library, instead of the WebCrypto library,
        // because we need to compute hashes synchronously (so we can
        // be sure the hash operation will complete before we let page
        // script run).
        const hash = sjcl.hash.sha256.hash(completeScriptCode);
        const hashBase64 = sjcl.codec.base64.fromBits(hash);

        return [completeScriptCode, hashBase64];
    };

    window.WEB_API_MANAGER.proxyBlockLib = {
        generateScriptPayload,
    };
}());

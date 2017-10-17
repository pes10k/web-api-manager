/*jslint es6: true, browser: true*/
/*global window*/
// The contents of this file are programatically injected into all frames.
// It is compiled into the src/instrument.js file to create the
// dist/instrument.js script/
(function () {
    "use strict";

    const settings = window.WEB_API_MANAGER_PAGE;
    const shouldLog = settings.shouldLog;
    const standardsToBlock = settings.toBlock;
    const standardDefinitions = settings.standards;
    const hostName = window.location.hostname;

    // Its possible that the Web API removal code will block direct references
    // to the following methods, so grab references to them before the
    // DOM is instrumented (and their references are possibly blocked).
    const removeChild = window.Element.prototype.removeChild;
    const getElementsByTagName = window.document.getElementsByTagName;

    const defaultFunction = function () {};
    const funcPropNames = Object.getOwnPropertyNames(defaultFunction);
    const unconfigurablePropNames = funcPropNames.filter(function (propName) {
        const possiblePropDesc = Object.getOwnPropertyDescriptor(defaultFunction, propName);
        return (possiblePropDesc && !possiblePropDesc.configurable);
    });

    const featuresToBlock = standardsToBlock.reduce(function (prev, cur) {
        return prev.concat(standardDefinitions[cur].features);
    }, []);

    const toPrimitiveFunc = function (hint) {
        if (hint === "number" || hint === "default") {
            return 0;
        }
        if (hint === "string") {
            return "";
        }
        return undefined;
    };

    const keyPathToRefPath = function (keyPath) {
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

    const createBlockingProxy = function (keyPath) {

        let hasBeenLogged = false;

        const logKeyPath = function () {

            if (keyPath !== undefined &&
                    hasBeenLogged === false &&
                    shouldLog) {
                hasBeenLogged = true;
                console.log("Blocked '" + keyPath + "' on '" + hostName + "'");
            }
        };

        let blockingProxy;
        blockingProxy = new Proxy(defaultFunction, {
            get: function (ignore, property) {
                logKeyPath();

                if (property === Symbol.toPrimitive) {
                    return toPrimitiveFunc;
                }

                if (property === "valueOf") {
                    return toPrimitiveFunc;
                }

                return blockingProxy;
            },
            set: function () {
                logKeyPath();
                return blockingProxy;
            },
            apply: function () {
                logKeyPath();
                return blockingProxy;
            },
            ownKeys: function (ignore) {
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
            }
        });

        return blockingProxy;
    };

    const defaultBlockingProxy = createBlockingProxy();

    const blockFeatureAtKeyPath = function (keyPath) {
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

            if (shouldLog === true) {
                parentRef[lastPropertyName] = createBlockingProxy(keyPath);
                return true;
            }

            parentRef[lastPropertyName] = defaultBlockingProxy;
            return true;
        } catch (e) {

            if (shouldLog) {
                console.log("Error instrumenting " + keyPath + ": " + e);
            }
            return false;
        }
    };

    featuresToBlock.forEach(blockFeatureAtKeyPath);

    // Next, delete the WEB_API_MANAGER_PAGE global property.  Technically
    // this never needed to be global, but doing so allows for easier
    // jslinting of the code, makes things easier to understand (for me
    // at least) and doesn't have any side effect as long as we delete
    // it when we're done, and before the page scripts can start running.
    delete window.WEB_API_MANAGER_PAGE;

    // Last, remove the script tag containing this code from the document,
    // so that the structure of the page looks like what the page author
    // expects / intended.
    const scriptTags = getElementsByTagName.call(window.document, "script");
    removeChild.call(scriptTags[0].parentNode, scriptTags[0]);
}());

// Initial content script for the Web API manager extension, that creates
// the "namespace" we'll use for all the content scripts in the extension.
(function () {
    "use strict";

    // If this code is being included by a unit test, the window object
    // won't exist, so stub it out here.
    try {
        if (window === undefined) {
            // This will throw in node...
        }
    } catch (e) {
        global.window = {};
    }

    window.WEB_API_MANAGER = {
        constants: {
            // The name of the cookie that will be used to push domain
            // configuration information into pages.
            cookieName: "_wamtcstandards",

            // The value in the packed array of options thats used to
            // include the shouldLog option in the in bitfield encoded in
            // the above cookie.
            shouldLogKey: "shouldLogKey",

            // The homepage of the extension.
            homepage: "https://github.com/snyderp/web-api-manager",

            // The name of the catch all rule set used when there are no
            // more specific matching domain rule sets.
            defaultPattern: "(default)",
        },
    };
}());

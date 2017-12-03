/**
 * User facing descriptions of categorizations of standards.
 */
(function () {
    "use strict";

    const categories = {
        "computation": {
            "title": "Computation",
            "desc": "Standards developers can use to peform certain " +
                    "types of computation faster, by taking advantage " +
                           "of more cores on a computer.",
        },
        "core": {
            "title": "Core functionality",
            "desc": "Standards that used to provide core, basic web " +
                    "page functionality.",
        },
        "graphics": {
            "title": "Graphics",
            "desc": "Standards that allow websites to do advanced " +
                    "graphical operations, such as very detailed " +
                    "animations and 3d graphics.",
        },
        "hardware": {
            "title": "Hardware",
            "desc": "Standards that allow websites to access sensors " +
                    "and other advanced hardware functonality.",
        },
        "media": {
            "title": "Media and File Handling",
            "desc": "Standards that allow websites to access files, video and " +
                    "media on your computer, beyond typical file uploads.",
        },
        "misc": {
            "title": "Miscellaneous",
            "desc": "Standards that do not easily fall in a broader caegory.",
        },
        "networking": {
            "title": "Networking",
            "desc": "Standards that allow websites to interact with servers, " +
                    "other web browsers, and embedded websites.",
        },
        "presentation": {
            "title": "Presentation",
            "desc": "Standards that change how websites can present their " +
                    "content to users, or how websites can determine how users " +
                    "are interacting with their content.",
        },
        "storage": {
            "title": "Storage",
            "desc": "Standards that allow websites to persistantly store " +
                    "information in your browser, beyond typical cookies.",
        },
        "timing": {
            "title": "Timing",
            "desc": "Standards that allow websites to do high resolution " +
                    "measurements of activies on their pages.",
        }
    };

    window.WEB_API_MANAGER.categoriesLib = {
        categories
    };
}());

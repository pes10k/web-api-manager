/**
 * This file defines default blocking rules for domains that haven't been
 * overwritten, either by the extension user, or by a subscribed policy
 * list.
 */
window.WEB_API_MANAGER.defaults = {};

window.WEB_API_MANAGER.defaults.conservative = [
    "MediaStream Recording",
    "DOM Parsing and Serialization",
    "Fullscreen API",
    "High Resolution Time Level 2",
    "HTML: Web Sockets",
    "HTML: Channel Messaging",
    "HTML: Web Workers",
    "Indexed Database API",
    "Performance Timeline Level 2",
    "Resource Timing",
    "Scalable Vector Graphics 1.1",
    "UI Events Specification",
    "Web Audio API",
    "WebGL Specification"
];

window.WEB_API_MANAGER.defaults.aggressive = window.WEB_API_MANAGER.defaults.conservative.concat([
    "Ambient Light Sensor API",
    "Battery Status API",
    "CSS Conditional Rules Module Level 3",
    "CSS Font Loading Module Level 3",
    "CSSOM View Module",
    "DOM Level 2: Traversal and Range",
    "Encrypted Media Extensions",
    "execCommand",
    "Fetch",
    "File API",
    "Gamepad",
    "Geolocation API",
    "HTML: Broadcasting",
    "HTML: Plugins",
    "HTML: History Interface",
    "HTML: Web Storage",
    "Media Capture and Streams",
    "Media Source Extensions",
    "Navigation Timing",
    "Performance Timeline Level 2",
    "Pointer Lock",
    "Proximity Events",
    "Selection API",
    "The Screen Orientation API",
    "Timing Control for Script-Based Animations",
    "URL",
    "User Timing Level 2",
    "W3C DOM4",
    "Web Notifications",
    "WebRTC 1.0"
]);
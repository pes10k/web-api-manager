/**
 * This file defines default blocking rules for domains that haven't been
 * overwritten, either by the extension user, or by a subscribed policy
 * list.
 */
window.WEB_API_MANAGER.defaults = {};

window.WEB_API_MANAGER.defaults.lite = [
    "Beacon",
    "Ambient Light Sensor API",
    "Scalable Vector Graphics (SVG) 1.1 (Second Edition)",
    "Geolocation API",
    "Gamepad",
    "Web Audio API",
    "Battery Status API",
    "WebVTT: The Web Video Text Tracks Format",
    "WebRTC 1.0: Real-time Communication Between Browser",
    "WebGL Specification",
    "Geometry Interfaces Module Level 1",
    "Web Notifications"
];

window.WEB_API_MANAGER.defaults.conservative = [
    "Beacon",
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
    "UI Events Specification",
    "WebGL Specification",
    "Web Audio API",
    "Scalable Vector Graphics (SVG) 1.1 (Second Edition)"
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
    "WebRTC 1.0: Real-time Communication Between Browser"
]);

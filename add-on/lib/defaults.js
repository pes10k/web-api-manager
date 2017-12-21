/**
 * This file defines default blocking rules for domains that haven't been
 * overwritten, either by the extension user, or by a subscribed policy
 * list.
 */
window.WEB_API_MANAGER.defaults = {};

window.WEB_API_MANAGER.defaults.lite = [
    4, // Beacon
    2, // Ambient Light Sensor API
    63, // Scalable Vector Graphics (SVG) 1.1 (Second Edition)
    29, // Geolocation API
    31, // Gamepad
    72, // Web Audio API
    3, // Battery Status API
    78, // WebVTT: The Web Video Text Tracks Format
    80, // WebRTC 1.0: Real-time Communication Between Browser
    73, // WebGL Specification
    74, // WebGL 2.0
    30, // Geometry Interfaces Module Level 1
    79, // Web Notifications
    70, // Vibration API
    77, // WebVR
    76, // WebUSB API
    75, // Web Speech API
];

window.WEB_API_MANAGER.defaults.conservative = [
    4, // Beacon,
    48, // MediaStream Recording
    11, // DOM Parsing and Serialization
    28, // Fullscreen API
    40, // High Resolution Time Level 2
    38, // HTML: Web Sockets
    34, // HTML: Channel Messaging
    39, // HTML: Web Workers
    44, // Indexed Database API
    55, // Performance Timeline Level 2
    58, // Resource Timing
    67, // UI Events Specification
    73, // WebGL Specification
    74, // WebGL 2.0
    72, // Web Audio API
    63, // Scalable Vector Graphics (SVG) 1.1 (Second Edition)
    77, // WebVR
    78, // WebVTT: The Web Video Text Tracks Format
    76, // WebUSB API
    75, // Web Speech API
];

window.WEB_API_MANAGER.defaults.aggressive = window.WEB_API_MANAGER.defaults.conservative.concat([
    2, // Ambient Light Sensor API,
    3, // Battery Status API
    6, // CSS Conditional Rules Module Level 3
    7, // CSS Font Loading Module Level 3
    8, // CSSOM View Module
    18, // DOM Level 2: Traversal and Range
    25, // Encrypted Media Extensions
    24, // execCommand
    26, // Fetch
    27, // File API
    31, // Gamepad
    29, // Geolocation API",
    32, // HTML: Broadcasting
    36, // HTML: Plugins
    35, // HTML: History Interface
    38, // HTML: Web Storage
    46, // Media Capture and Streams
    47, // Media Source Extensions
    50, // Navigation Timing
    55, // Performance Timeline Level 2
    52, // Pointer Lock
    51, // Proximity Events
    60, // Selection API
    62, // The Screen Orientation API
    65, // Timing Control for Script-Based Animations
    68, // URL
    69, // User Timing Level 2
    21, // W3C DOM4
    79, // Web Notifications
    80, // WebRTC 1.0: Real-time Communication Between Browser
    33, // HTML: Canvas Element
]);

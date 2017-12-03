Adding New Standards
===

## Documenting Standards in the Extension

The process for adding a standard for blocking to the extension is pretty
simple.  All the standards are documented in the `sources/standards` directory
in the [repo](https://github.com/snyderp/web-api-manager/tree/master/sources).
Each JSON file in this directory describes a standard.  The structure of the
JSON file is mostly self-explanatory, except for the `id` key (which is a fixed
identifier for the standard, so that the user-facing name of the standard can
be changed if needed without effecting stored values) and the `category` key
(which is a reference to a category defined in `add-on/lib/categories.js`).

Adding a new standard starts by creating a new JSON file in `sources/standards`.
If we were going to describe a new standard called `Example API`, we'd create
`sources/standards/EXAMPLE.json`, and create a JSON text that matches the
structure of the files in the repo.

The build process for the extension (`npm run bundle`) will handle all the
other work of getting it integrated into the extension.


## Determining Methods In A Standard

The trickiest part of the whole process is determining what methods are
defined by a WebIDL file (e.g. what goes in the `methods: []` part of the JSON
file.).  In this section I'll use WebGL as an example for this process.

The WebGL standard is currently documented in two files (since its covered by
two standards): WEBGL.json and WEBGL2.json. The JSON files try to document
every method defined in the standard.  Properties are not altered by the
extension currently.

You can find which methods are defined in a standard by first looking up
the standard spec, and then finding all the methods defined in the WebIDL
definitions ([WebIDL](https://developer.mozilla.org/en-US/docs/Mozilla/WebIDL_bindings)
is a test format for describing javascript interfaces, that resembles C++
header files).  In the example of WebGL, the standard is
[here](https://www.khronos.org/registry/webgl/specs/latest/2.0/), and the
WebIDL is [here](https://www.khronos.org/registry/webgl/specs/latest/2.0/webgl2)
(unfortunately the WebIDL definitions are not always so nicely provided in
their own text file, sometimes it has to be taken out of the HTML).

Then, once you have the WebIDL, its just a matter of finding all the methods
defined, and tying them to their location in the DOM.  For example, the WebGL2
WebIDL defines a large number of methods on the WebGL2RenderingContext object.
Take the line:

```
	void bufferData(GLenum target, GLsizeiptr size, GLenum usage);
```

This defines a method called `bufferData` on the `WebGL2RenderingContextBase`
interface.  Normally we'd expect to find something called
`WebGL2RenderingContextBase.prototype.bufferData` in the DOM, but, the
`[NoInterfaceObject]` rule (found above `interface WebGL2RenderingContextBase`)
tells us that there is no such thing as `WebGL2RenderingContextBase` in the DOM.
However, down the page there is this definition:

```
interface WebGL2RenderingContext
{
};
WebGL2RenderingContext implements WebGL2RenderingContextBase;
```

which says that `WebGL2RenderingContext` will have all the methods defined in
`WebGL2RenderingContextBase` on it.  And, if we confirm this by typing
`WebGL2RenderingContext.prototype.bufferData`, this function exists.

There are a couple of other rules in WebIDL that can make things occasionally
trickier, but they are rare, and the above will capture 95% of the methods that
need to be documented.

Just repeat the above process for every method defined in the standard, and
wah-la, done!


## Gotchas

A few things to keep in mind when documenting a standard.

1.  Some browsers implement standards behind prefixed structure names.  For
    example Chrome implements the
    [`RTCPeerConnection`](https://w3c.github.io/webrtc-pc/#dom-rtcpeerconnection)
    object from the [WebRTC standard](https://w3c.github.io/webrtc-pc/) as both
    `RTCPeerConnection` and `webkitRTCPeerConnection`.  Its important to check
    for these possible alternate spellings.
2.  WebIDL sometimes defines singleton functions, that don't appear on an
    object's prototype, but as a single function on a defined object. These are
    declared with the `static` keyword in the WebIDL, and are pretty rare.

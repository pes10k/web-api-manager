Web API Manager
===

*This project is not currently maintained*. I no longer have the time to keep
it supported.  I would welcome a co-maintainer to work with though, if someone
might be interested. If so, please contact me over email.

Running the Extension
---
Download built versions of the extension from each browsers' extension stores:
*   [Firefox](https://addons.mozilla.org/en-US/firefox/addon/webapi-manager/)
*   [Chrome](https://chrome.google.com/webstore/detail/webapi-manager/hojoljbhkebfjalcbnfmoiljfidcmcmj)

By default, this extension does not make any changes. No aspects of the Web
API are affected until you start creating custom rule sets, or modifying what
Web API standards sites have access to by default. You can start creating
these rules through the site's configuration pane.

You can find some suggested page configurations in the [Wiki](https://github.com/snyderp/web-api-manager/wiki).


Overview
---
This extension allows users to selectively allow different hosts on the web
to have access to different types of browser functionality. Doing so allows
security and privacy sensitive web users to limit the attack surface presented
to websites, and to limit websites to the functionality they actually need
to carry out user-serving purposes.


Background
---
Web browsers gain staggering numbers of new features, without their users
knowing what new functionality is being pushed into their trusted base.
While some of this functionality is broadly useful for things commonly thought
of as "web" related, a large amount of it is useful in only rare situations,
if ever.  Examples of this rarely-needed functionality includes the
low level audio synthesis capabilities of the [Web Audio API](https://webaudio.github.io/web-audio-api/),
the low level graphics capabilities of [WebGL](https://get.webgl.org/),
or the light sensing capabilities of the [Ambient Light Sensor API](https://www.w3.org/TR/ambient-light/).
Such complex-but-rarely-used functionality has been often used in attacks
on the security and privacy of the web.

Other functionality is frequently used by web sites, but for non-user-serving
purposes, like fingerprinting anonymous users and tracking them across websites.
Examples of such functionality includes parts of the [SVG API](https://www.w3.org/TR/SVG/),
parts of the the [Canvas Element](https://html.spec.whatwg.org/multipage/scripting.html#the-canvas-element)'s functionality,
and the [Beacon standard](https://www.w3.org/TR/beacon/), among many others.

This extension helps users stay private and secure online by limiting websites
to only the functionality they need, and prevent them from accessing rarely
needed and/or privacy violating functionality.


Functionality
---
The extension currently includes the following functionality:
*   Creation of domain-specific functionality rules, based on host-matching
    regular expressions.
*   Blocking of functionality across all domains, with a fallback, "default"
    blocking rule.
*   A novel method of blocking functionality, designed to minimize the effect
    of removing functionality on existing code that expects that functionality
    to be in place.
*   A categorization of approximately 1,400 JavaScript methods into 74 different
    Web API standards (and, where appropriate, sub-standards).
*   User feedback to alert users how many hosts are executing script every time
    they visit a site, to ease the creating of new rules.

The following functionality is not currently implemented, but is being considered
for future inclusion:
*   The ability to subscribe to blocking rule sets created by trusted third
    parties, similar to the EasyList / AdBlockPlus model of rule subscriptions.
*   Blocking property accesses on non-global structures through an additional
    level of interposition on runtime created objects.
*   Adding new Web API standards into the code base.
*   Extend blocking to properties and events (currently only functions and
    methods are interposed on).


Contributing
---
Pull requests and contributions of all kinds are greatly appreciated. One
thing that would be extremely helpful is help compiling information about
new browser standards.  The process is not too tricky, and is documented at
`docs/ADDING_STANDARDS.md`.

And in general, please feel free to reach out, either through the issue queue
or through email (psnyde2@uic.edu).


Building
---
You can build the extension with the following steps:

```
npm install
npm run bundle

# You'll then have a zip'ed up version of the extension at `dist/webapi_manager.zip`
```


Testing and Development
---
There is a [Mocha](https://mochajs.org/) and [Selenium](http://docs.seleniumhq.org/)
based test suite in place now.  To run it you'll need to provide the test suite
with some social networking credentials (to make check for previous regressions
related to cookies and logging into sites).

To run the tests, give the following a try:

```
# install the development libraries
npm install

# copy the skeleton config file to where the test scripts expect it to be.
cp test.config.example.js test.config.js

# edit the new test config file to add github and google account credentials
vim test.config.js

# Run the test suite
npm test

# Or, if you want to watch the tests run...
npm run test:watch
```


Background
---
This extension is based on research conducted at the [BITSLab](https://www.cs.uic.edu/Bits/)
at the [University of Illinois at Chicago](https://www.cs.uic.edu/).  Further
information on the measurements and techniques used in this extension can
be found in the following papers.

*   Peter Snyder, Cynthia Taylor, and Chris Kanich,
    “[Most Websites Don’t Need to Vibrate: A Cost–Benefit Approach to Improving Browser Security](https://arxiv.org/abs/1708.08510),”
    in Proceedings of the [2017 ACM Conference on Computer and Communications Security](https://www.sigsac.org/ccs/CCS2017/), 2017.
*   Pete Snyder, Laura Waitker, Cynthia Taylor, and Chris Kanich,
    “[CDF: Predictably Secure Web Documents](https://www.cs.uic.edu/~psnyder/static/papers/CDF_Predictably_Secure_Web_Documents.pdf),”
    in Proceedings of the [2017 Workshop on Technology and Consumer Protection](http://www.ieee-security.org/TC/SPW2017/ConPro/), 2017.
*   Peter Snyder, Lara Ansari, Cynthia Taylor, and Chris Kanich,
    “[Browser Feature Usage on the Modern Web](https://www.cs.uic.edu/~psnyder/static/papers/Browser_Feature_Usage_on_the_Modern_Web.pdf),”
    in Proceedings of the [2016 Internet Measurement Conference](http://conferences.sigcomm.org/imc/2016/), 2016.

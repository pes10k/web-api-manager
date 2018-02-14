/**
 * Definitions of interfaces used throughout the system.
 */

/**
 * @enum {string} ShouldLogVal
 * Enum style value that stores all possible setting for the "should log"
 * value.
 *
 * NONE indicates that no logging should occur, STANDARD that selected
 * features should be blocked and loged, and PASSIVE means that nothing
 * should be blocked, but everything should be logged.
 */

/**
 * Represents an instruction, being pushed from the background process into
 * a content script, to instruct the content script on what features to block
 * (and other related runtime settings).
 *
 * @typedef {object} ProxyBlockSettings
 * @property {Array.number} standardIdsToBlock
 *   An array of strings, each a standard that should be blocked.
 * @property {ShouldLogVal} shouldLog
 *   Whether whether and how logging should be enabled.
 * @property {boolean} blockCrossFrame
 *   Boolean description of whether to block parent frames from accesing
 *   the DOMs of child frames.
 * @property {Array.FeaturePath} customBlockedFeatures
 *   An array of strings, describing features that should be blocked
 *   in the DOM.
 * @property {string} randNonce
 *   A unique, unguessable identifier, used so that the injected content
 *   script can communicate with the content script, using an unguessable
 *   event name (so that the guest page cannot listen to or spoof
 *   these messages).
 */

/**
 * A shorthand, reg-ex like rule for matching domains.
 *
 * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
 *
 * @typedef {string} MatchPattern
 */

/**
 * Represents and manages all of the user configuration in the extension.
 *
 * Manages the domains the user has set, which standards should be blocked
 * for each domain-matching rule, whether logging is enabled, etc.
 *
 * @typedef {object} Preferences
 * @property {function(): Array.BlockRule} getAllRules
 *   Returns an array of all the blocking rules configured in the system.
 * @property {function(): BlockRule} getDefaultRule
 *   Returns the block rule object that should be used if no other
 *   blocking rules match a given url.
 * @property {function(): Array.BlockRule} getNonDefaultRules
 *   Returns an array all user-set block rules in the system (e.g. every
 *   block rule that is not a default rule).
 * @property {function(string): BlockRule} getRuleForUrl
 *   Return the blocking rule that should be used for the given URL.
 * @property {function(string): BlockRule} getRuleForHost
 *   Return the blocking rule that should be used for the given host.
 * @property {function{MatchPattern}: ?BlockRule} getRuleForPattern
 *   Returns the blocking rule that describes what to block on the given
 *   pattern, or undefined if no such rule exists.
 * @property {function{BlockRule}: boolean} addRule
 *   Adds a blocking rule to the set of rules the user has set to block.
 *   This will not overwrite any rules, and returns false if there is
 *   already a rule in place for this pattern.  Otherwise returns true.
 * @property {function(MatchPattern): boolean} deleteRuleForPattern
 *   Attempts to delete a blocking rule for the system, by looking to see
 *   if there is a BlockRule that matches the given pattern match.
 * @property {function(MatchPattern, Array.number): boolean} upcertRuleStandardIds
 *   Either updates the set of standards blocked for a given match
 *   pattern, or creates a new blocking rule.  Returns a boolean description
 *   of whether a new BlockRule object was created.
 * @property {function(MatchPattern, Array.FeaturePath): boolean} upcertRuleCustomBlockedFeatures
 *   Either updates the set of custom blocking rules for a given match
 *   pattern, or creates a new blocking rule.  Returns a boolean description
 *   of whether a new BlockRule object was created.
 * @property {function(BlockRule): undefined} setTemplateRule
 *   Sets a blocking rule that can have its blocked standards and blocked
 *   features applied to other domain rules.
 * @property {function(): BlockRule} getTemplateRule
 *   Returns a blocking rule that can be applied to other matching rules.
 * @property {function(): Array.number} getTemplate
 *   Gets the standards that should be used for a reusable blocking template.
 * @property {function(ShouldLogVal): undefined} setShouldLog
 *   Sets whether the system should log what functionality was blocked.  Throws
 *   if the given value is not a valid ShouldLogVal value.
 * @property {function(): ShouldLogVal} getShouldLog
 *   Returns whether the system is currently configured to log
 *   what standards / features are blocked.
 * @property {function(): boolean} getBlockCrossFrame
 *   Gets whether the system should block frames from access the DOM of other
 *   frames.
 * @property {function(boolean): undefined} setBlockCrossFrame
 *   Sets whether the system should block frames from access the DOM of other
 *   frames.
 * @property {function(): object} toStorage
 *   Returns an encoding of the preferences object that can be saved
 *   using the storage API.
 * @property {function(): string} toJSON
 *   Returns a serialized version of the current state of user preferences,
 *   encoded as a JSON string. Used when sending user preferences to
 *   contexts across process boundaries or to other contexts where they
 *   should have read only access to user preferences.
 */

/**
 * An structure that defines which stanards should be blocked on domains.
 *
 * @typedef {object} BlockRule
 * @property {function(): string} toJSON
 *   Returns a serialized version of the data contained in this object,
 *   as a JSON string.
 * @property {function(): object} toData
 *   Returns an object, representing a copy of the data represented by this
 *   object.  This is basically toJSON, but without the serialization step.
 * @property {function(string): boolean} isMatchingUrl
 *   Returns a boolean description of whether this block rule should
 *   be applied to a url.
 * @property {function(string): boolean} isMatchingHost
 *   Returns a boolean description of whether this block rule should
 *   be applied to a host.
 * @property {MatchPattern} pattern
 *   Read only reference to the match pattern this rule applies to.
 * @property {function(MatchPattern): undefined} setPattern
 *   Sets a new pattern that this rule should match against.
 * @property {function(): Array.number} getStandardIds
 *   Returns a new array of the standard ids being blocked by this rule.
 * @property {function(Array.number): undefined} setStandardIds
 *   Sets the standard ids that should be blocked by this rule.
 * @property {function(): Array.FeaturePath} getCustomBlockedFeatures
 *   Returns an array of strings describing paths to features in the DOM
 *   to block.  The returned array will be sorted in string order.
 * @property {function(Array.FeaturePath): undefined} setCustomBlockedFeatures
 *   Sets an array of paths to features in the DOM that should be blocked
 *   for domains that match this blocking rule.
 * @property {function(): Array.FeaturePath} getAllBlockedFeatures
 *   Returns an array of all the features that are blocked in this rule,
 *   either from a standard that is blocked, or set as a custom blocked
 * feature, in alphabetical order.
 * @property {function(): boolean} isBlockingAnyFeatures
 *   Returns true if this rule is blocking any features, either b/c of blocking
 *   a standard, or because of a custom blocking rule.
 */

/**
 * Describes all feature blocking that has occured in any frame in any tab.
 *
 * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs
 * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation
 *
 * @typedef {object} BlockReport
 * @property {function(): string} toJSON
 *   Returns a string, that depicts all of the recorded blocking data
 *   as a JSON string.
 * @property {function(number): boolean} initTabReport
 *   Initilizes a tab report for a given tab id in the block report.
 *   Takes the id of the tab that should be initilized in the report,
 *   and returns true if a new tab report was initilized in the report, or
 *   false if otherwise (because there was already a report for the tab id).
 * @property {function(number): ?TabReport} getTabReport
 *   Takes an id for a tab, referring to one of the tabs open in the
 *   browser.  Returns either a TabReport object that describes the blocking
 *   that has occured in that tab, or undefined if the given tab id does
 *   not match an open, tracked tab.
 * @property {function(): Array.TabReport} getAllTabReports
 *   Returns an array containing TabReport objects, collectivly describing
 *   all of the blocking that has occured on all of the tabs in the system.
 * @property {function(string): Array.FrameReport} getFrameReportsForUrl
 *   Returns an array containing FrameReport objects, describing
 *   blocking that has occured on any frames that initially loaded the
 *   given url.
 * @property {function(number): boolean} deleteTabReport
 *   Takes a tab id, describing a tab that is or was open in the browser,
 *   and deletes all logged information about the blocking that occured
 *   in that tab (used to prune the logging data when a tab closes).
 *   Returns true if information about a tab was deleted, and otherwise
 *   false (such as if an unrecognized tab id was provided).
 * @property {function(number, number, string): boolean} initFrameReport
 *   Takes a tab id, frame id and a url, describing a frame that is being
 *   loaded in the browser. Creates a record to record blocking in the frame
 *   (used, for example, when the user opens a new tab, or a tab loads
 *   an iframe).  Returns if a new FrameReport object was initilized, and
 *   otherwise false (such as if an unrecognized tab id was provided,
 *   or there is already a FrameReport for this frame in the specified tab).
 * @property {function(number, number, FeaturePath)} recordBlockedFeature
 *   Takes a tab id, frame id, and identifier for a feature that was blocked
 *   in the frame.  Records that a given feature was blocked.
 */

/**
 * Represents a tab in the browser where blocking occured, and describes
 * the standards and features that were blocked in the frames in this tab.
 *
 * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs
 *
 * @typedef {object} TabReport
 * @property {function(): string} toJSON
 *   Returns a string, that depicts the data in this tab report, serialized
 *   as JSON.  Creates output designed to be consumed by
 *   reportsLib.tabReportFromJSON.
 * @property {number} id
 *   The identifier for the tab in the browser (as defined in the
 *   WebExtension Tabs API).
 * @property {function(): boolean} isEmpty
 *   Returns whether any blocking or frames have been recorded on this tab.
 * @property {function(): Array.FrameReport} getAllFrameReports
 *   Returns an array of FrameReport objects, each describing the blocking
 *   that occured on a frame in this tab.
 * @property {function(string): Array.FrameReport} getFrameReportsForUrl
 *   Returns an array of FrameReport objects that represent frames
 *   that initially loaded the passed URL.  This is a convience filtering
 *   method that returns a subset of what `getAllFrameReports` returns.
 * @property {function(number): ?FrameReport} getFrameReport
 *   Takes a frameID (as defined in the WebExtension webNavigation API)
 *   that describes a frame that was loaded in this tab, and returns
 *   either a FrameReport object that describes the blocking that occured
 *   on that frame, or undefined if no matching frame exists in this tab.
 */

/**
 * Represents a frame loaded in a tab, and desribes which standards and
 * features were blocked on that frame.
 *
 * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webNavigation
 *
 * @typedef {object} FrameReport
 * @property {string} url
 *   The initial URL that this frame loaded (note that the URL could have
 *   changed since its initial load, but this value will always give
 *   at the initial URL that was loaded).
 * @property {number} id
 *   The frameID (as defined in the WebExtension webNavigation API)
 *   describing this frame.
 * @property {function(): Array.StandardReport} getAllStandardReports
 *   Returns an array of StandardReport objects, each representing a
 *   Web API standard that was blocked at least once in this frame.
 * @property {function(string): ?StandardReport} getStandardReport
 *   Takes a standard id, which describes a Web API standard in the
 *   extension. Either returns a StandardReport object (describing
 *   which features in that standard have been blocked in this frame),
 *   or undefined if no methods in that standard have been blocked so far.
 * @property {function(): boolean} hasBlocked
 *   Returns a boolean description of whether any blocking of Web API
 *   features and standards has occured on this frame.
 */

/**
 * Represents a standard that was blocked in a frame, and describes which
 * features in the standard were blocked.
 *
 * @typedef {object} StandardReport
 * @property {string} id
 *   The unqiue identifier for a Web API standard in the extension.
 * @property {string} name
 *   The human readable name for this standard
 * @property {function(): number} getNumBlockedFeatures
 *   Returns the number of features in this standard that were blocked.
 * @property {function(FeaturePath): boolean} wasFeatureBlocked
 *   Returns whether the passed feature was blocked in this standard.
 * @property {function(): Array.FeaturePath} featurePaths
 *   Returns an array or strings, each describing a feature that was
 *   blocked in this standard.
 */

/**
 * A string, describing a keypath to a feature's definition in the DOM.
 * @typedef {string} FeaturePath
 */

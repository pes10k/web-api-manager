/**
 * Code for managing rules for what standards are blocked on which domains.
 */
(function () {
    "use strict";

    const {standardsLib, constants} = window.WEB_API_MANAGER;

    // From https://www.npmjs.com/package/escape-string-regexp
    const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

    const escapeStringRegexp = aString => {
        if (typeof aString !== "string") {
            throw new TypeError("Expected a string");
        }

        return aString.replace(matchOperatorsRe, "\\$&");
    };

    /**
     * Mapping of string to regular expression objects, to prevent having
     * to repeatedly parse the same match patterns into regular expressions.
     */
    const reCache = new Map();

    /**
     * Compiles a match pattern into a regular expression.
     *
     * This function basically maps the nicer PatternMatch syntax to the
     * more powerful, but uglier, regex syntax.
     *
     * The results of this function are internally cached.
     *
     * This code is mainly adapted from the matcher npm package.
     *
     * @see https://www.npmjs.com/package/matcher
     *
     * @param {MatchPattern} matchPattern
     *   A string describing a set of URLs that should be matched.
     *
     * @return {RegEx}
     *   A regular expresison object that encodes the given match pattern.
     */
    const makeRe = matchPattern => {
        if (reCache.has(matchPattern)) {
            return reCache.get(matchPattern);
        }

        const negated = matchPattern[0] === "!";

        if (negated) {
            matchPattern = matchPattern.slice(1);
        }

        matchPattern = escapeStringRegexp(matchPattern).replace(/\\\*/g, ".*");

        if (negated) {
            matchPattern = `(?!${matchPattern})`;
        }

        const re = new RegExp(`^${matchPattern}$`, "i");
        re.negated = negated;
        reCache.set(matchPattern, re);

        return re;
    };

    /**
     * Tests to see if a match pattern matches a given host name.
     *
     * This function matches slightly more loosely than what is described by
     * mozilla in the given link, since it treats a wildcard as segment
     * as matching urls w/o that segment (e.g. "*.example.com" matches
     * "example.com").
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
     *
     * @param {MatchPattern} matchPattern
     *   A match pattern, describing a set of URLs in RegEx like format.
     * @param {string} host
     *   A url to test against the provided pattern.
     *
     * @return {boolean}
     *   Boolean description of whether the given match pattern matches
     *   the host name.
     */
    const testPatternWithHost = (matchPattern, host) => {
        const compiledPattern = makeRe(matchPattern);

        if (compiledPattern.test(host) === true) {
            return true;
        }

        if (matchPattern.startsWith("*.") &&
                matchPattern.endsWith(host) &&
                matchPattern.length === host.length + 2) {
            return true;
        }

        return false;
    };

    /**
     * Tests to see if a match pattern matches a given url.
     *
     * This function matches slightly more loosely than what is described by
     * mozilla in the given link, since it treats a wildcard as segment
     * as matching urls w/o that segment (e.g. "*.example.com" matches
     * "example.com").
     *
     * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
     *
     * @param {MatchPattern} matchPattern
     *   A match pattern, describing a set of URLs in RegEx like format.
     * @param {string} url
     *   A url to test against the provided pattern.
     *
     * @return {boolean}
     *   Boolean description of whether the given match pattern matches
     *   the url.
     */
    const testPatternWithUrl = (matchPattern, url) => {
        const hostName = window.URI.parse(url).host;
        return testPatternWithHost(matchPattern, hostName);
    };

    /**
     * Creates a new block rule object, specifying which standards to block
     * on which domains.
     *
     * @param {MatchPattern} matchPattern
     *   A string describing which domains this rule should apply to.
     * @param {?Array.number} standardIds
     *   An array of integers, each describing a standard that should be
     *   blocked.
     * @param {?Array.FeaturePath} blockedFeatures
     *   An array of strings, describing features that should be blocked
     *   in this rule, even if their containing standard is allowed.
     *
     * @return {BlockRule}
     *   A block rule object, configured to block the given standards on
     *   domains matching the match pattern.
     */
    const init = (matchPattern, standardIds, blockedFeatures) => {
        let localMatchPattern = matchPattern;
        let localStandardIds = standardIds ? standardIds.slice() : [];
        let localBlockedFeatures = blockedFeatures ? blockedFeatures.slice() : [];

        const setStandardIds = newStandardIds => {
            localStandardIds = newStandardIds;
        };

        const getStandardIds = () => localStandardIds.sort((a, b) => (a - b));

        const setCustomBlockedFeatures = blockedFeatures => {
            localBlockedFeatures = blockedFeatures;
        };

        const getCustomBlockedFeatures = () => localBlockedFeatures.sort();

        const getAllBlockedFeatures = () => {
            const allBlockedFeatures = localStandardIds
                .reduce((collection, stdId) => {
                    return collection.concat(standardsLib.featuresForStandardId(stdId));
                }, [])
                .concat(localBlockedFeatures);

            return Array.from(new Set(allBlockedFeatures)).sort();
        };

        const isBlockingAnyFeatures = () => {
            return localStandardIds.length > 0 || localBlockedFeatures.length > 0;
        };

        const getPattern = () => localMatchPattern;

        const setPattern = newMatchPattern => {
            localMatchPattern = newMatchPattern;
        };

        const toData = () => {
            return Object.assign({}, {
                p: localMatchPattern,
                s: getStandardIds(),
                f: getCustomBlockedFeatures(),
            });
        };

        const toJSON = () => JSON.stringify(toData());

        return Object.freeze({
            toData,
            toJSON,
            setStandardIds,
            getStandardIds,
            setCustomBlockedFeatures,
            getCustomBlockedFeatures,
            getAllBlockedFeatures,
            isBlockingAnyFeatures,
            getPattern,
            setPattern,
            isMatchingHost: testPatternWithHost.bind(undefined, localMatchPattern),
            isMatchingUrl: testPatternWithUrl.bind(undefined, localMatchPattern),
        });
    };

    /**
     * Initilizes a BlockRule object, based on the data exported from the
     * BlockRule.toData function.
     *
     * @param {object} object
     *   An object generated by `BlockRule.toData`.
     *
     * @return {BlockRule}
     *   An initilized BlockRule object.
     *
     *
     * @throws If the given object is not in the expected fromat, generated by
     *   `BlockRule.toData`.
     */
    const fromData = object => {
        if (object.p === undefined ||
                object.s === undefined ||
                object.f === undefined) {
            throw `'Data is not a valid BlockRule: expected to find "p", "s" and "f" properties.`;
        }

        if (Array.isArray(object.s) === false ||
                object.s.every(value => typeof value === "number") === false) {
            throw `Data is not a valid BlockRule: the "s" property should be an array of standard ids.`;
        }

        if (Array.isArray(object.f) === false ||
                object.f.every(value => typeof value === "string") === false) {
            throw `Data is not a valid BlockRule: the "f" property should contain an array of strings, describing features to block.`;
        }

        return init(object.p, object.s, object.f);
    };

    /**
     * Initilizes a BlockRule object, based on a serialized version
     * of a BlockRule objects (generated from a call to `BlockRule.toJSON`).
     *
     * @param {string} jsonString
     *   A JSON string generated from `BlockRule.toJSON`.
     *
     * @return {BlockRule}
     *   An initilized BlockRule object.
     *
     * @throws If the given string is not in the expected fromat, generated by
     *   `BlockRule.toJSON`.
     */
    const fromJSON = jsonString => {
        const data = JSON.parse(jsonString);
        return fromData(data);
    };

    /**
     * Checks to see if the proposed match pattern looks like a valid one.
     *
     * This function performs some basic validation checks against the
     * proposed match pattern.  It is more intended to help honest-but-falable
     * users, and not to protect against malicious inputs.
     *
     * This method currently checks the following:
     *   - That the match pattern is not empty, or a string only containing
     *     white space.
     *   - That the match pattern does not match any of the special values
     *     used internally to indicate some special cases (specifically
     *     the "default" matching case, and the "is a template rule" cases).
     *
     * @param {string} proposedMatchPattern
     *   A string, representing a possible match pattern.
     *
     * @return {[boolean, ?string]}
     *   An array of length two.  The first value is a boolean describing
     *   whether the given string is a valid match pattern.  If true,
     *   then the second value will be undefined.  Otherwise, the second
     *   value will be a string describing why the given match pattern
     *   is invalid.
     */
    const isValidMatchPattern = proposedMatchPattern => {
        const trimmedPattern = proposedMatchPattern.trim();
        const {defaultPattern, templatePattern} = constants;

        if (trimmedPattern === "") {
            return [false, "Match patterns cannot be empty strings."];
        }

        if  (trimmedPattern === defaultPattern) {
            return [
                false,
                `${defaultPattern} cannot be used as a pattern because its used to indicate the fallback rule.`,
            ];
        }

        if (trimmedPattern === templatePattern)  {
            return [
                false,
                `${templatePattern} cannot be used as a pattern because its used to indicate the template rule.`,
            ];
        }

        return [true, undefined];
    };

    window.WEB_API_MANAGER.blockRulesLib = {
        init,
        fromData,
        fromJSON,
        isValidMatchPattern,
    };
}());

const os = require("os");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const request = require("request");

const idlLib = require(path.join(__dirname, "idl"));

const utf8Enc = {encoding: "utf8"};
const standardsSourceDirPath = path.join(__dirname, "..", "sources", "standards");
const pathToWebIdlScraperScript = path.join(
    __dirname, "..", "node_modules", "webidl-scraper", "cli", "index.js"
);

/**
 * Returns the WebIDL definition for a standard.
 *
 * This IDL is taken from three possible locations.  First, if there is
 * an `interface.idl` file in the standard's directory, the contents
 * of that file is returned. Else, scrape the IDL definition from the URL
 * given in the standard's `info.json` file.
 *
 * @param {string} standardDirName
 *   The name of the directory where the information for this standard is
 *   stored.  This should be one of the directories located in
 *   sources/standards
 *
 * @return {string}
 *   The WebIDL definition describing the interfaces for this file.
 *
 * @throws
 *   If the IDL for this file couldn't be determined.
 */
const webIdlForStandard = standardDirName => {
    const standardSourceDirPath = path.join(standardsSourceDirPath, standardDirName);

    const infoFilePath = path.join(standardSourceDirPath, "info.json");
    const infoFileText = fs.readFileSync(infoFilePath, utf8Enc);
    const standardInfo = JSON.parse(infoFileText);
    const standardId = standardInfo.id;

    let webIdlDefText;

    try {
        const webIdlDefPath = path.join(standardSourceDirPath, "interfaces.idl");
        // First see if the webidl for this standard is specified in the
        // standards definition in an "interfaces.idl" file.  If so, treat
        // that as truth.
        webIdlDefText = fs.readFileSync(webIdlDefPath, utf8Enc);
    } catch (ignore) {
        // Pass through, indicating that there is not a hard-coded
        // set of IDL interfaces defined for this standard.
    }

    // If there isn't a hard coded interfaces file, fetch the IDL based
    // on the URL in the standard's info file.
    if (webIdlDefText === undefined) {

        const [scrapeTool, webStandardUrls] = standardInfo.webidl === undefined
            ? [pathToWebIdlScraperScript, [standardInfo.url]]
            : ["curl", standardInfo.webidl];

        const scrapeResults = webStandardUrls.map(url => {
            const result = childProcess.spawnSync(
                scrapeTool,
                [url],
                {
                    windowsHide: true,
                    encoding: "utf8",
                }
            );

            if (result.status !== 0 || result.stdout.length === 0) {
                throw `Unable to scrape IDL from ${url} for standard ${standardInfo.name}`;
            }
            return result.stdout;
        });

        webIdlDefText = scrapeResults.join("\n");
    }

    return webIdlDefText;
};

/**
 * Returns the parsed JSON data in the info.json file for the standard.
 *
 * @param {string} standardDirName
 *   The name of the directory where the information for this standard is
 *   stored.  This should be one of the directories located in
 *   sources/standards
 *
 * @return {object}
 *   An object, depicting the parsed JSON data in the info.json file for the
 *   standard.
 *
 * @throw
 *   This function throws an exception if an info.json could not be read,
 *   or if the contained data is not valid JSON.
 */
const infoForStandard = standardDirName => {
    const standardSourceDirPath = path.join(standardsSourceDirPath, standardDirName);
    const infoFilePath = path.join(standardSourceDirPath, "info.json");
    const infoFileText = fs.readFileSync(infoFilePath, utf8Enc);
    return JSON.parse(infoFileText);
};

/**
 * Returns the features defined for this standard.  This information can
 * come from several different places.
 *
 *  1) Use features.json if it exists in the standard's directory.
 *  2) If not, see if there is an interfaces.idl file in the directory, and if
 *     so, parse it for the features in the standard.
 *  3) If not, fetch the IDL information for the standard from the "url" entry
 *     in the info.json file.
 *
 * @param {string} standardDirName
 *   The name of the directory where the information for this standard is
 *   stored.  This should be one of the directories located in
 *   sources/standards.
 *
 * @return {object.<string, array.string>}
 *   Returns an object describing the features for this standard. This object
 *   has two properties, "methods" and "properties", each pointing to an
 *   array of strings (key paths to features in the DOM).
 */
const featuresForStandard = standardDirName => {
    const standardSourceDirPath = path.join(standardsSourceDirPath, standardDirName);

    try {
        const featuresText = fs.readFileSync(path.join(standardSourceDirPath, "features.json"), utf8Enc);
        const featuresData = JSON.parse(featuresText);
        return featuresData;
    } catch (ignore) {
        // Pass through case, indicating that there is not currently
        // a features.json file in the directory we can easily read from.
    }

    const idlForStandard = webIdlForStandard(standardDirName);
    const interfacesInStandard = idlLib.idlTextToFeatures(idlForStandard);

    // Now merge all the methods in the interfaces defined in the standard
    // together, to create a single set for all the methods defined in the
    // standard (and then do the same thing for properties).
    const methods = new Set();
    const properties = new Set();

    Object.values(interfacesInStandard).forEach(features => {
        features.methods.forEach(Set.prototype.add.bind(methods));
        features.properties.forEach(Set.prototype.add.bind(properties));
    });

    return {
        methods: Array.from(methods.values()).sort(),
        properties: Array.from(properties.values()).sort(),
    };
};

module.exports.featuresForStandard = featuresForStandard;
module.exports.infoForStandard = infoForStandard;
module.exports.webIdlForStandard = webIdlForStandard;

#!/usr/bin/env node
/**
 * @file
 * Helper tool to determine the date for a standard, based on the date
 * listed on the standard's website.
 */

const path = require("path");
const fs = require("fs");

const request = require("request");
const argparse = require("argparse");

const buildLib = require(path.join(__dirname, "..", "lib", "build"));

const parser = new argparse.ArgumentParser({
    addHelp: true,
    description: "Tool to populate the info.json file of a standard with the date listed on the standard's website.",
});

parser.addArgument(["-d", "--dir"], {
    help: "Name of the directory of the standard to build a features.json file for.  This will always be one of the directories in sources/standards.",
    required: true,
});

parser.addArgument(["-o", "--stdout"], {
    help: "Print features.json file to STDOUT, instead of saving as a features.json file in the standard's directory.",
    action: "storeTrue",
});

const args = parser.parseArgs();

// First check and validate that the given standards directory exists.
const pathToStandardDir = path.join(".", "..", "sources", "standards", args.dir);
try {
    fs.statSync(pathToStandardDir);
} catch (ignore) {
    console.error(`${args.dir} is not a directory in sources/standards.`);
    process.exit(1);
}

const infoForStandard = buildLib.infoForStandard(args.dir);
const urlForStandard = infoForStandard.url;

const dateRegExs = [
    /datetime="(.+?)"/,
    /publishDate:.+?"([0-9\-]+)"/,
    /((:?19|20)[\d]{6})/,
];

const options = {
    url: urlForStandard,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0',
    },
};

request(options, (error, response, body) => {
    if (error) {
        console.error(error);
        process.exit(1);
    }

    let foundDate = dateRegExs.reduce((accumulator, regex) => {
        if (accumulator !== null) {
            return accumulator;
        }

        const regexResult = body.match(regex);
        if (regexResult === null) {
            return null;
        }

        return regexResult[1];
    }, null);

    if (foundDate === null) {
        console.error(`Unable to determine date for ${infoForStandard.name}.`);
        process.exit(1);
    }

    if (foundDate.length === 8) {
        foundDate = foundDate.slice(0, 4) + "-" + foundDate.slice(4, 6) + "-" + foundDate.slice(6, 8);
    }

    console.log(infoForStandard.name, foundDate);
    if (args.stdout === true) {
        process.exit(0);
    }

    infoForStandard.date = foundDate;
    const newInfoText = JSON.stringify(infoForStandard, null, "  ");
    fs.writeFileSync(path.join(pathToStandardDir, "info.json"), newInfoText);
});


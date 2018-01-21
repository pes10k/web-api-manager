#!/usr/bin/env node
/**
 * @file
 * Command line tool to build the features.json file for a standard, either
 * by parsing the interfaces.idl file in the standard's directory (in
 * sources/standards) or by trying to fetch the IDL from the URL in the
 * info.json file in the standard's directory.
 */

const path = require("path");
const fs = require("fs");

const argparse = require("argparse");

const buildLib = require(path.join(__dirname, "..", "lib", "build"));

const parser = new argparse.ArgumentParser({
    addHelp: true,
    description: "Tool to parse WebIDL for a Web API standard in its methods and properties.",
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

const featuresForStandard = buildLib.featuresForStandard(args.dir);
const featuresAsString = JSON.stringify(featuresForStandard, null, "  ");

if (args.stdout) {
    console.log(featuresAsString);
    process.exit(1);
}

fs.writeFileSync(path.join(pathToStandardDir, "features.json"), featuresAsString);
process.exit(0);

const gulp = require("gulp");
const fs = require("fs");

gulp.task('default', function () {

    const isLineAComment = function (aLine) {
        const lineStartsWithComment = (
            aLine.indexOf("// ") === 0 ||
            aLine.indexOf("/*") === 0 ||
            aLine.indexOf(" */") === 0 ||
            aLine.indexOf(" * ") === 0
        );
        return lineStartsWithComment;
    };

    const builtScriptComment = "/** This file is automatically generated. **/\n";
    const standardsDefDir = "data/standards";

    // Build all the standards listings into a single features.js file.
    const combinedStandards = fs.readdirSync(standardsDefDir)
        .reduce(function (prev, next) {

            if (next.indexOf(".json") === -1) {
                return prev;
            }

            const fileContents = fs.readFileSync(standardsDefDir + "/" + next, {encoding: "utf8"});
            const standardContents = JSON.parse(fileContents);
            const nameParts = [standardContents.info.name, standardContents.info.subsection_name].filter(part => !!part);
            const standardIdentifier = nameParts.join(": ").trim();
            standardContents.info.identifier = standardIdentifier;
            prev[standardIdentifier] = standardContents;
            return prev;
        }, {});

    const renderedStandardsModule = builtScriptComment + `window.WEB_API_MANAGER.standards = ${JSON.stringify(combinedStandards)};`;

    fs.writeFileSync("data/standards.js", renderedStandardsModule);
});

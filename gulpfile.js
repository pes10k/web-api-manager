let gulp = require('gulp');
let fs = require('fs');

gulp.task('default', function () {

    let standardsDefDir = "data/standards";

    // Build all the standards listings into a single features.js file.
    let combinedStandards = fs.readdirSync(standardsDefDir)
        .reduce(function (prev, next) {

            if (next.indexOf(".json") === -1) {
                return prev;
            }

            let fileContents = fs.readFileSync(standardsDefDir + "/" + next, {encoding: "utf8"});
            let standardContents = JSON.parse(fileContents);
            prev[standardContents.info.name] = standardContents;
            return prev;
        }, {});

    let renderedStandardsModule = "window.WEB_API_MANAGER.standards = " + JSON.stringify(combinedStandards) + ";";

    fs.writeFileSync("content_scripts/standards.js", renderedStandardsModule);
});

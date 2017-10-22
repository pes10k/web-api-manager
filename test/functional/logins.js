"use strict";

let assert = require("assert");
let utils = require("./lib/utils");

describe("Test logging into popular sites", function () {

    this.timeout = function () {
        return 10000;
    };

    describe("GitHub", function () {

        it("Log into site", function (done) {

            const standardsToBlock = ["Beacon"];
            let driver;
            
            utils.promiseGetDriver()
                .then(function (driver, addonId) {
                    driver = driver;
                    return utils.promiseSetBlockingRules(driver, standardsToBlock);
                });
                    // .then(_ => utils.promiseAddonConfigButton(driver))
                    // .then(function (configButton) {
                    //     configButton.click();
                    // });
        });
    });
});

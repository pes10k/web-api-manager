"use strict";

// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require("geckodriver");

const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const FxRunnerUtils = require("fx-runner/lib/utils");
const injectedScripts = require("./injected");
const fs = require("fs");
const By = webdriver.By;
const Context = firefox.Context;
const until = webdriver.until;
const path = require("path");

module.exports.promiseAddonButton = function (driver) {
    driver.setContext(Context.CHROME);
    return driver.wait(until.elementLocated(
        By.css("[tooltiptext='WebAPI Manager']")
    ), 2000);
};

module.exports.promiseExtensionConfigPage = function (driver) {
    const extensionIdPattern = /url\("moz-extension:\/\/(.*?)\/images/;
    return this.promiseAddonButton(driver)
        .then(button => button.getAttribute("style"))
        .then(function (buttonStyle) {
            const match = extensionIdPattern.exec(buttonStyle);
            const extensionId = match[1];
            driver.setContext(Context.CONTENT);
            return driver.get(`moz-extension://${extensionId}/config/index.html`);
        })
};

module.exports.promiseAddonConfigButton = function (driver) {
    driver.setContext(Context.CHROME);
    return driver.wait(until.elementLocated(
            By.id("config-page-link")
        ), 2000);
};

module.exports.promiseSetBlockingRules = function (driver, standardsToBlock) {
    const setStandardsScript = injectedScripts.setStandardsAsBlockedScript(standardsToBlock);
    driver.setContext(Context.CONTENT);

    return this.promiseExtensionConfigPage(driver)
        .then(driver.executeAsyncScript(setStandardsScript));
};

module.exports.promiseGetDriver = function (callback) {

    let driver = new webdriver.Builder()
        .forBrowser('firefox')
        .build();

    driver.setContext(Context.CHROME);

    let fileLocation = path.join(process.cwd(), "dist", "webapi_manager.zip");

    // This manually installs the add-on as a temporary add-on.
    // Hopefully selenium/geckodriver will get a way to do this soon:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1298025
    let installAddOnPromise = driver.executeAsyncScript(
        injectedScripts.temporaryAddOnInstallScript(),
        fileLocation
    );

    return installAddOnPromise
        .then(function (result) {
            if (!result[0] && result[1]) {
                return driver.quit().then(() => {
                    throw new Error(`Failed to install add-on: ${result[1]}`);
                });
            }

            return Promise.resolve(driver, result[0]);
        });
};
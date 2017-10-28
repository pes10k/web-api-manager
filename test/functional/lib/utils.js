"use strict";

// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require("geckodriver");

const firefox = require("selenium-webdriver/firefox");
const webdriver = require("selenium-webdriver");
const injectedScripts = require("./injected");
const by = webdriver.By;
const Context = firefox.Context;
const until = webdriver.until;
const keys = webdriver.Key;
const path = require("path");

module.exports.constants = {
    svgBlockRule: ["Scalable Vector Graphics (SVG) 1.1 (Second Edition)"]
};

module.exports.pause = function (ms = 2000) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
};

module.exports.promiseSetFormAndSubmit = function (driver, values) {
    driver.setContext(Context.CONTENT);
    const numberOfPairs = values.length;

    const setFormValue = function (index = 0) {

        const [name, value] = values[index];

        if (index === numberOfPairs - 1) {

            return driver.findElement(by.name(name))
                .sendKeys(value, keys.ENTER);

        } else {

            return driver.findElement(by.name(name))
                .sendKeys(value)
                .then(() => setFormValue(index + 1));
        }
    };

    return setFormValue();
};

module.exports.promiseAddonButton = function (driver) {
    driver.setContext(Context.CHROME);
    return driver.wait(until.elementLocated(by.css("[tooltiptext='WebAPI Manager']")), 2000);
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
        });
};

module.exports.promiseAddonConfigButton = function (driver) {
    driver.setContext(Context.CHROME);
    return driver.wait(until.elementLocated(by.id("config-page-link")), 2000);
};

module.exports.promiseSetBlockingRules = function (driver, standardsToBlock) {
    const setStandardsScript = injectedScripts.setStandardsAsBlockedScript(standardsToBlock);
    driver.setContext(Context.CONTENT);

    return this.promiseExtensionConfigPage(driver)
        .then(driver.executeAsyncScript(setStandardsScript))
        .then(() => module.exports.pause(1000));
};

module.exports.promiseGetDriver = function () {

    const binary = new firefox.Binary();

    if (process.argv.indexOf("--watch") === -1) {
        binary.addArguments("--headless");
    }

    const driver = new webdriver.Builder()
        .forBrowser("firefox")
        .setFirefoxOptions(new firefox.Options().setBinary(binary))
        .build();

    driver.setContext(Context.CHROME);

    const fileLocation = path.join(process.cwd(), "dist", "webapi_manager.zip");

    // This manually installs the add-on as a temporary add-on.
    // Hopefully selenium/geckodriver will get a way to do this soon:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1298025
    const installAddOnPromise = driver.executeAsyncScript(
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

            driver.setContext(Context.CONTENT);
            return Promise.resolve(driver, result[0]);
        });
};

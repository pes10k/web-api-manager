"use strict";

// The geckodriver package downloads and installs geckodriver for us.
// We use it by requiring it.
require("geckodriver");

const firefox = require("selenium-webdriver/firefox");
const injectedScripts = require("./injected");
const Context = firefox.Context;
const webdriver = require("selenium-webdriver");
const {logging, until} = webdriver;
const by = webdriver.By;
const keys = webdriver.Key;

const path = require("path");
const addonLibPath = path.join(__dirname, "..", "..", "..", "add-on", "lib");
// These will returning anything, but are called to populate
// window.WEB_API_MANAGER.
require(path.join(addonLibPath, "init.js"));
require(path.join(addonLibPath, "standards.js"));
require(path.join(addonLibPath, "reports.js"));
const {reportsLib} = window.WEB_API_MANAGER;


module.exports.shouldRunRemoteTests = process.argv.indexOf("--only-local-tests") === -1;

module.exports.constants = {
    svgBlockRule: [63],
};

module.exports.pause = function (ms = 2000) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};

module.exports.promiseSetFormAndSubmit = (driver, values) => {
    driver.setContext(Context.CONTENT);
    const numberOfPairs = values.length;

    const setFormValue = (index = 0) => {
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

module.exports.promiseAddonButton = driver => {
    driver.setContext(Context.CHROME);
    return driver.wait(until.elementLocated(by.css("[tooltiptext='WebAPI Manager']")), 2000);
};

const promiseGetExtensionId = driver => {
    const extensionIdPattern = /url\("moz-extension:\/\/(.*?)\/images/;
    return module.exports.promiseAddonButton(driver)
        .then(button => button.getAttribute("style"))
        .then(buttonStyle => {
            const match = extensionIdPattern.exec(buttonStyle);
            const extensionId = match[1];
            driver.setContext(Context.CONTENT);
            return Promise.resolve(extensionId);
        });
};

module.exports.promiseExtensionConfigPage = driver => {
    return promiseGetExtensionId(driver)
        .then(extensionId => driver.get(`moz-extension://${extensionId}/config/index.html`));
};

module.exports.promiseSetBlockingRules = (driver, standardsToBlock) => {
    const setStandardsScript = injectedScripts.setStandardsAsBlockedScript(standardsToBlock);
    driver.setContext(Context.CONTENT);

    return module.exports.promiseExtensionConfigPage(driver)
        .then(() => driver.executeAsyncScript(setStandardsScript))
        .then(() => module.exports.pause(100));
};

module.exports.promiseSetShouldLog = (driver, shouldLog) => {
    driver.setContext(Context.CONTENT);
    return module.exports.promiseExtensionConfigPage(driver)
        .then(() => driver.wait(until.elementLocated(by.css(".logging-settings input"))))
        .then(elm => {
            const isCurrentlyLogging = elm.value === "on";
            if (shouldLog === isCurrentlyLogging) {
                return Promise.resolve(true);
            }
            return elm.click();
        });
};

module.exports.promiseOpenLoggingTab = (driver, tabId) => {
    return promiseGetExtensionId(driver)
        .then(extensionId => {
            const reportUrl = `moz-extension://${extensionId}/pages/report/report.html?tabId=${tabId}`;
            return driver.get(reportUrl);
        });
};

module.exports.promiseOpenNewTab = (driver, url) => {
    let initialHandle;
    let allHandles;
    let openedHandle;
    return driver.getWindowHandle()
        .then(handle => {
            initialHandle = handle;
            return driver.getAllWindowHandles();
        })
        .then(windowHandles => {
            allHandles = windowHandles;
            return driver.executeScript("window.open(window.location.href);");
        })
        .then(() => driver.getAllWindowHandles())
        .then(newHandles => {
            const diffHandles = newHandles.filter(handle => allHandles.indexOf(handle) === -1);
            if (diffHandles.length === 0) {
                return Promise.reject(new Error("Could not find window handle for new tab window."));
            }
            const popupHandle = diffHandles[0];
            return driver.switchTo().window(popupHandle);
        })
        .then(() => driver.get(url))
        .then(() => driver.getAllWindowHandles())
        .then(newHandles => {
            const diffHandles = newHandles.filter(handle => allHandles.indexOf(handle) === -1);
            if (diffHandles.length === 0) {
                return Promise.reject(new Error("Could not find window handle for new tab window."));
            }
            openedHandle = diffHandles[0];
            return driver.switchTo().window(openedHandle);
        })
        .then(() => Promise.resolve({prior: initialHandle, new: openedHandle}));
};

module.exports.promiseGetBlockReport = driver => {
    let initialHandle;
    let blockReport;
    return promiseGetExtensionId(driver)
        .then(foundExtensionId => {
            const reportLogUrl = `moz-extension://${foundExtensionId}/pages/report/report-json.html`;
            return module.exports.promiseOpenNewTab(driver, reportLogUrl);
        })
        .then(tabHandles => {
            initialHandle = tabHandles.prior;
            return driver.executeScript("return window.WEB_API_MANAGER_REPORT.blockingReportJSON;");
        })
        .then(fetchedLogData => {
            if (!fetchedLogData) {
                return Promise.reject(new Error("Unable to fetch log data."));
            }
            blockReport = fetchedLogData;
            return driver.close();
        })
        .then(() => driver.switchTo().window(initialHandle))
        .then(() => Promise.resolve(reportsLib.initBlockReport(blockReport)));
};

module.exports.promiseGetDriver = () => {
    const binary = new firefox.Binary();

    if (process.argv.indexOf("--watch") === -1) {
        binary.addArguments("--headless");
    }

    const loggingPrefs = new logging.Preferences();
    loggingPrefs.setLevel(logging.Type.BROWSER, logging.Level.DEBUG);

    const driver = new webdriver.Builder()
        .forBrowser("firefox")
        .setLoggingPrefs(loggingPrefs)
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

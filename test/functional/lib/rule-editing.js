/**
 * Helper functions for testing the editing of match patterns for existing
 * blocking rules.
 */
const webdriver = require("selenium-webdriver");
const {until} = webdriver;
const by = webdriver.By;
const keys = webdriver.Key;

const utils = require("./utils");


/**
 * Returns a promise that resolves to either the "Edit" button for changing
 * the match pattern for the currently selected rule (if it exists), or
 * undefined (if that button is not visible).
 *
 * This function expects that the config page is already open.
 *
 * @param {WebDriver} driver
 *   The selenium webdriver object.
 *
 * @return {Promise.<?Button>}
 *   A promise, that yields either a reference to the button for editing
 *   the match pattern for the currently selected rule, or undefined
 *   if the button is not visible.
 */
module.exports.promiseGetPatternEditButton = driver => {
    const editButtonId = "pattern-edit-button-start";
    return driver.wait(until.elementLocated(by.id(editButtonId)), 500)
        .catch(() => Promise.resolve(undefined));
};

/**
 * Returns a promise that resolves to either the "Save" button for changing
 * the match pattern for the currently selected rule (if it exists), or
 * undefined (if that button is not visible).
 *
 * This function expects that the config page is already open.
 *
 * @param {WebDriver} driver
 *   The selenium webdriver object.
 *
 * @return {Promise.<?Button>}
 *   A promise, that yields either a reference to the button for saving
 *   the match pattern for the currently selected rule, or undefined
 *   if the button is not visible.
 */
module.exports.promiseGetPatternSaveButton = driver => {
    const saveButtonId = "pattern-edit-button-save";
    return driver.wait(until.elementLocated(by.id(saveButtonId)), 500)
        .catch(() => Promise.resolve(undefined));
};

/**
 * Returns a promise that resolves to either the input field for changing
 * the match pattern for the currently selected rule (if it exists), or
 * undefined (if that input is not visible).
 *
 * This function expects that the config page is already open.
 *
 * @param {WebDriver} driver
 *   The selenium webdriver object.
 *
 * @return {Promise.<?Button>}
 *   A promise, that yields either a reference to the input for saving
 *   the match pattern for the currently selected rule, or undefined
 *   if the input is not visible.
 */
module.exports.promiseGetPatternInput = driver => {
    const inputId = "pattern-edit-input";
    return driver.wait(until.elementLocated(by.id(inputId)), 500)
        .catch(() => Promise.resolve(undefined));
};

/**
 * Sets a value in the "new pattern" field, for changing the match pattern
 * of an existing block rule.
 *
 * This function expects that the config page is already open.
 *
 * @param {WebDriver} driver
 *   The selenium webdriver object.
 * @param {string} newPattern
 *   The match pattern string to set in the input field.
 *
 * @return {Promise.<undefined>}
 *   A promise that yields the results of the WebElement.sendKeys call.
 */
module.exports.promiseSetPatternInput = (driver, newPattern) => {
    const selectAllKey = process.platform === "darwin" ? keys.META : keys.CONTROL;
    const inputId = "pattern-edit-input";
    let inputRef;
    return driver.wait(until.elementLocated(by.id(inputId)), 500)
        .then(input => {
            inputRef = input;
            return input.sendKeys(selectAllKey, "a", keys.NULL);
        })
        .then(() => utils.pause(250))
        .then(() => inputRef.sendKeys(newPattern));
};

/**
 * Returns a promise that resolves to the text in the "new pattern" field, or
 * undefined if that field is not in the page.
 *
 * This function expects that the config page is already open.
 *
 * @param {WebDriver} driver
 *   The selenium webdriver object.
 *
 * @return {Promise.<?string>}
 */

module.exports.promiseGetPatternInputValue = driver => {
    const inputId = "pattern-edit-input";
    return driver.wait(until.elementLocated(by.id(inputId)), 500)
        .then(input => input.getAttribute("value"))
        .catch(() => Promise.resolve(undefined));
};

/**
 * Returns the currently displayed error message related to editing the
 * match pattern for an existing rule.
 *
 * This function expects that the config page is already open.
 *
 * @param {WebDriver} driver
 *   The selenium webdriver object.
 *
 * @return {Promise.<?string>}
 *   Returns a promsie that resolves with either the displayed error message,
 *   if one exists, or undefined if no error message is displayed.
 */
module.exports.promiseGetErrorMessage = driver => {
    const msgElmId = "pattern-edit-alert";
    return driver.wait(until.elementLocated(by.id(msgElmId)), 500)
        .then(msgElm => msgElm.getAttribute("innerText"))
        .catch(() => Promise.resolve(undefined));
};

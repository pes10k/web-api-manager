/**
 * Script for page that generates a report about which features were blocked
 * in which tab.
 */
(function () {
    "use strict";

    const {constants, browserLib} = window.WEB_API_MANAGER;
    const doc = window.document;
    const rootObject = browserLib.getRootObject();
    const loadingSection = doc.getElementById("loading-section");
    const loadedSection = doc.getElementById("loaded-section");
    const featureReportDiv = loadedSection.querySelector("div");
    const homepageLink = `<a href="${constants.homepage}">${constants.homepage}</a>`;

    // The Id of the tab we should generate a report should be passed to the
    // page as the tabId=<integer> parameter.
    const queryString = window.URI.parse(window.location.href).query;

    if (!queryString.match(/^tabId=[0-9]+$/)) {
        loadingSection.className += " hidden";
        loadedSection.className = " alert alert-danger";
        loadedSection.innerHtml = "There was an error loading this report. " +
                                  "This should not happen! Please open an " +
                                  `issue at ${homepageLink}.`;
        return;
    }

    /**
     * Returns a div, describing blocked features in a standard.
     *
     * @param {string} standardName
     *   The name of the standard being represented, such as "Console API".
     * @param {Array.string} blockedFeatures
     *   An array of one or more strings, each describing a feature that was
     *   blocked, belonging to the given standard.
     *
     * @return {Element}
     *   A div element, depicting a bootstrap style markedup panel, with the
     *   blocked features presented in a list in the panel.
     */
    const buildStandardReport = (standardName, blockedFeatures) => {
        const standardReportPanelElm = doc.createElement("div");
        standardReportPanelElm.dataset.standard = standardName;
        standardReportPanelElm.className = "panel panel-default standard-report-container";

        const standardTitlePanelHeader = doc.createElement("div");
        standardTitlePanelHeader.className = "panel-heading";
        standardTitlePanelHeader.appendChild(doc.createTextNode(standardName));
        standardReportPanelElm.appendChild(standardTitlePanelHeader);

        const featuresListElm = doc.createElement("ul");
        featuresListElm.className = "list-group";
        blockedFeatures.sort().forEach(featureName => {
            const featureLiElm = doc.createElement("li");
            featureLiElm.className = "list-group-item feature-container";
            featureLiElm.dataset.feature = featureName;
            featureLiElm.appendChild(doc.createTextNode(featureName));
            featuresListElm.appendChild(featureLiElm);
        });

        standardReportPanelElm.appendChild(featuresListElm);
        return standardReportPanelElm;
    };

    /**
     * Returns a div that describes standards that were blocked in a frame.
     *
     * @param {object} frameReport
     *   Object with two properties, "url", which contains a the string
     *   this frame has loaded, as a string, and "standards", which contains
     *   an object mapping standard names to features that were blocked in
     *   that standard (represented as an array of strings).
     *
     * @return {Element}
     *   A div element, describing the frame that had standards blocked
     *   on it, as a <h3> header tag and a series of bootstrap marked up div
     *   panel elements (one for each standard blocked).
     */
    const buildFrameReport = (frameReport) => {
        const {url, standards} = frameReport;

        const frameReportContainerElm = doc.createElement("div");
        frameReportContainerElm.dataset.url = url;
        frameReportContainerElm.className = "frame-report-container";

        const frameUrlTitleElm = doc.createElement("h3");
        const frameUrlCodeElm = doc.createElement("code");
        frameUrlCodeElm.appendChild(doc.createTextNode(url));
        frameUrlTitleElm.appendChild(doc.createTextNode("Frame URL: "));
        frameUrlTitleElm.appendChild(frameUrlCodeElm);
        frameReportContainerElm.appendChild(frameUrlTitleElm);

        Object.keys(standards).sort().forEach(standardName => {
            const blockedFeaturesForStandards = standards[standardName];
            const standardReport = buildStandardReport(standardName, blockedFeaturesForStandards);
            frameReportContainerElm.appendChild(standardReport);
        });

        return frameReportContainerElm;
    };

    const tabId = window.parseInt(queryString.replace("tabId=", ""));
    const message = ["blockedFeaturesForTab", {tabId}];
    rootObject.runtime.sendMessage(message, response => {

        const [messageType, frameMapping] = response;

        if (messageType !== "blockedFeaturesForTabResponse") {
            return;
        }

        loadingSection.className += " hidden";
        loadedSection.className = loadedSection.className.replace("hidden", "");
        Object.keys(frameMapping).forEach(frameId => {
            const frameReport = frameMapping[frameId];
            const reportForFrame = buildFrameReport(frameReport);
            featureReportDiv.appendChild(reportForFrame);
        });
    });
}());

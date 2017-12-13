/**
 * Script for page that generates a report about which features were blocked
 * in which tab.
 */
(function () {
    "use strict";

    const {constants, browserLib, standardsLib, reportsLib} = window.WEB_API_MANAGER;
    const doc = window.document;
    const rootObject = browserLib.getRootObject();
    const loadingSection = doc.getElementById("loading-section");
    const loadedSection = doc.getElementById("loaded-section");
    const nonBlockingFramesSection = doc.getElementById("frames-without-blocking-section");
    const featureReportDiv = doc.getElementById("blocked-feature-report");
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
     * @param {StandardReport} standardReport
     *   An object describing which features in a Web API standard were blocked.
     *
     * @return {Element}
     *   A div element, depicting a bootstrap style markedup panel, with the
     *   blocked features presented in a list in the panel.
     */
    const buildStandardReport = standardReport => {
        const standardReportPanelElm = doc.createElement("div");
        const standardName = standardReport.name;
        standardReportPanelElm.dataset.standardId = standardReport.id;
        standardReportPanelElm.className = "panel panel-default standard-report-container";

        const standardTitlePanelHeader = doc.createElement("div");
        standardTitlePanelHeader.className = "panel-heading";
        standardTitlePanelHeader.appendChild(doc.createTextNode(standardName));
        standardReportPanelElm.appendChild(standardTitlePanelHeader);

        const featuresListElm = doc.createElement("ul");
        featuresListElm.className = "list-group";
        standardReport.featurePaths().sort().forEach(featurePath => {
            const featureLiElm = doc.createElement("li");
            featureLiElm.className = "list-group-item feature-container";
            featureLiElm.dataset.feature = featurePath;
            featureLiElm.appendChild(doc.createTextNode(featurePath));
            featuresListElm.appendChild(featureLiElm);
        });

        standardReportPanelElm.appendChild(featuresListElm);
        return standardReportPanelElm;
    };

    /**
     * Returns a div that describes standards that were blocked in a frame.
     *
     * @param {FrameReport} frameReport
     *   A frame report object, describing which features and Web API
     *   standards have been blocked in a frame.
     *
     * @return {Element}
     *   A div element, describing the frame that had standards blocked
     *   on it, as a <h3> header tag and a series of bootstrap marked up div
     *   panel elements (one for each standard blocked).
     */
    const buildFrameReport = frameReport => {
        const frameReportContainerElm = doc.createElement("div");
        frameReportContainerElm.dataset.url = frameReport.url;
        frameReportContainerElm.className = "frame-report-container";

        const frameUrlTitleElm = doc.createElement("h3");
        const frameUrlCodeElm = doc.createElement("code");
        frameUrlCodeElm.appendChild(doc.createTextNode(frameReport.url));
        frameUrlTitleElm.appendChild(doc.createTextNode("Frame URL: "));
        frameUrlTitleElm.appendChild(frameUrlCodeElm);
        frameReportContainerElm.appendChild(frameUrlTitleElm);

        const blockedStandardIds = frameReport.getAllStandardReports()
            .map(standardReport => standardReport.id);

        const sortedStandardIds = blockedStandardIds.sort(standardsLib.sortStandardsById);
        const sortedStandardReports = sortedStandardIds.map(frameReport.getStandardReport);

        sortedStandardReports.forEach(standardReport => {
            const standardReportElm = buildStandardReport(standardReport);
            frameReportContainerElm.appendChild(standardReportElm);
        });

        return frameReportContainerElm;
    };

    /**
     * Build a list item for a frame that was loaded without blocked content.
     *
     * @param {string} url
     *   A URL that was loaded in the document, but which had no blocked
     *   standards called
     * @param {number} count
     *   The number of times this URL was loaded as a frame without
     *   any blocked content being loaded.
     *
     * @return {Element}
     *   A list item element, marked up for bootstrap3, depicting the frame's
     *   URL and possibly the number of times the frame was loaded w/o having
     *   functionality blocked.
     */
    const buildNonBlockedFrameUrlListItem = (url, count) => {
        const frameListItemElm = doc.createElement("li");
        frameListItemElm.className = "list-group-item frame-url-item";
        frameListItemElm.dataset.frameUrl = url;

        if (count > 1) {
            const countElm = doc.createElement("span");
            countElm.className = "badge";
            countElm.dataset.count = count;
            countElm.appendChild(doc.createTextNode(count));
            frameListItemElm.appendChild(countElm);
        }

        frameListItemElm.appendChild(doc.createTextNode(url));
        return frameListItemElm;
    };

    /**
     * Generates a listing of URLs, depciting frames with no blocked standards.
     *
     * @param {Array.string} urls
     *   An array of one or more URLs, each depicting a frame where no
     *   WebAPI standards were blocked.
     *
     * @return {Element}
     *   An HTML element that depicts the URLs (and how many frames loaded
     *   that URL).
     */
    const buildNonBlockingReport = urls => {
        // Convert the array of URLs, to an object mapping each URL to the
        // number of frames that loaded that URL.
        const urlToCountMapping = urls.reduce((collection, aUrl) => {
            if (collection[aUrl] === undefined) {
                collection[aUrl] = 1;
            } else {
                collection[aUrl] += 1;
            }
            return collection;
        }, Object.create(null));

        const nonBlockingReportListElm = doc.createElement("ul");
        nonBlockingReportListElm.className = "list-group non-blocking-frames-list";
        Object.keys(urlToCountMapping).sort().forEach(aUrl => {
            const loadCount = urlToCountMapping[aUrl];
            const liElm = buildNonBlockedFrameUrlListItem(aUrl, loadCount);
            nonBlockingReportListElm.appendChild(liElm);
        });

        return nonBlockingReportListElm;
    };

    const tabId = window.parseInt(queryString.replace("tabId=", ""));
    const message = ["blockedFeaturesReport", {tabId}];
    rootObject.runtime.sendMessage(message, response => {
        const [messageType, tabReportAsJSON] = response;

        if (messageType !== "blockedFeaturesReportResponse") {
            return;
        }

        const tabReport = reportsLib.tabReportFromJSON(tabReportAsJSON);

        const [framesWithBlocking, framesWithoutBlocking] = tabReport.getAllFrameReports()
            .reduce((collection, frameReport) => {
                const binIndex = (frameReport.hasBlocked() === true) ? 0 : 1;
                collection[binIndex].push(frameReport);
                return collection;
            }, [[], []]);

        loadingSection.className += " hidden";
        loadedSection.className = loadedSection.className.replace("hidden", "");

        framesWithBlocking.forEach(frameReport => {
            const reportForFrame = buildFrameReport(frameReport);
            featureReportDiv.appendChild(reportForFrame);
        });

        if (framesWithoutBlocking.length > 0) {
            const urlsWithoutBlocking = framesWithoutBlocking.map(frameReport => frameReport.url);
            const nonBlockingFramesElm = buildNonBlockingReport(urlsWithoutBlocking);
            nonBlockingFramesSection.className = "";
            nonBlockingFramesSection.appendChild(nonBlockingFramesElm);
        }
    });
}());

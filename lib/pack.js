/*jslint es6: true*/
/*global window*/
(function () {
    "use strict";

    const bucketSize = 8;

    const binOptionsReduceFunction = function (binSize, prev, next) {

        if (prev.length === 0) {
            prev.push([next]);
            return prev;
        }

        const mostRecentBin = prev[prev.length - 1];
        if (mostRecentBin.length < binSize) {
            mostRecentBin.push(next);
            return prev;
        }

        prev.push([next]);
        return prev;
    };

    const pack = function (options, selected) {

        const numBuckets = Math.ceil(options.length / bucketSize);
        const binToBucketSizeFunc = binOptionsReduceFunction.bind(undefined, bucketSize);
        options.sort();

        const binnedOptions = options.reduce(binToBucketSizeFunc, []);
        const bitFields = new Uint8Array(numBuckets);

        for (let i = 0; i < numBuckets; i += 1) {
            let bitfield = 0;
            let currentBucket = binnedOptions[i];

            for (let j = 0; j < currentBucket.length; j += 1) {

                let currentOption = currentBucket[j];
                if (selected.indexOf(currentOption) !== -1) {
                    bitfield |= 1 << j;
                }
            }

            bitFields[i] = bitfield;
        }

        const decoder = new TextDecoder('utf8');
        return window.btoa(decoder.decode(bitFields));
    };

    const unpack = function (options, data) {

        const numBuckets = Math.ceil(options.length / bucketSize);
        const binToBucketSizeFunc = binOptionsReduceFunction.bind(undefined, bucketSize);
        options.sort();

        const binnedOptions = options.reduce(binToBucketSizeFunc, []);

        const encoder = new TextEncoder('utf8');
        const bitFields = encoder.encode(window.atob(data));

        const result = [];

        for (let i = 0; i < bitFields.length; i += 1) {
            let currentBitField = bitFields[i];
            let currentOptionsBin = binnedOptions[i];

            for (let j = 0; j < bucketSize; j += 1) {
                if (currentBitField & (1 << j)) {
                    let currentOption = currentOptionsBin[j];
                    result.push(currentOption);
                }
            }
        }

        return result;
    };

    window.WEB_API_MANAGER.packingLib = {
        pack, unpack
    };
}());
// Functions to represent a selection of options out of a bigger set
// in a compact, base64 representation.
//
// This is used in the extension to encode which Web API standards should
// be blocked on the current domain, in a way that can be encoded in a cookie
// value.
//
// The two exposed functions in this module are pack and unpack, which are
// inverses of each other.  For example:
//
// const options = ["A", "B", "C"];
// const selection = ["B", "C"];
// const base64EncodedSelection = pack(options, selection);
// const decodedSelection = unpack(options, base64EncodedSelection);
// JSON.stringify(decodedSelection) === JSON.stringify(selection) // true
(function () {
    "use strict";

    const bucketSize = 8;

    /**
     * Encodes a buffer (such as a Uint8Array) to a base64 encoded string.
     *
     * @param {ArrayBuffer} buf
     *   A buffer of binary data.
     *
     * @return {string}
     *   A base64 encoded string.
     */
    const bufferToBase64 = function (buf) {
        const binstr = Array.prototype.map.call(buf, function (ch) {
            return String.fromCharCode(ch);
        }).join("");
        return window.btoa(binstr);
    };

    const base64StrToBuffer = function (base64str) {
        const binstr = window.atob(base64str);
        const buf = new Uint8Array(binstr.length);
        Array.prototype.forEach.call(binstr, function (ch, i) {
            buf[i] = ch.charCodeAt(0);
        });
        return buf;
    };

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

    /**
     * Encodes a selection of values, from a larger set of possible options,
     * into a base64 encoded bitfield.
     *
     * The caller should make sure that selected is a subset of options.
     *
     * The ordering of options and selected do not matter.
     *
     * This function is the inverse of the `unpack` function from this module.
     *
     * @param {array} options
     *   An array of all possible options that might need to be encoded.
     * @param {array} selected
     *   An array containing zero or more elements from option.
     *
     * @return {string}
     *   A base64 encoded string, which encodes which elements in `options`
     *   were in the provided `selected` array.
     */
    const pack = function (options, selected) {
        const numBuckets = Math.ceil(options.length / bucketSize);
        const binToBucketSizeFunc = binOptionsReduceFunction.bind(undefined, bucketSize);
        options.sort();

        const binnedOptions = options.reduce(binToBucketSizeFunc, []);
        const bitFields = new Uint8Array(numBuckets);

        let i, j;

        for (i = 0; i < numBuckets; i += 1) {
            let bitfield = 0;
            const currentBucket = binnedOptions[i];

            for (j = 0; j < currentBucket.length; j += 1) {
                const currentOption = currentBucket[j];
                if (selected.indexOf(currentOption) !== -1) {
                    bitfield |= 1 << j;
                }
            }

            bitFields[i] = bitfield;
        }

        const encodedString = bufferToBase64(bitFields);
        return encodedString;
    };

    /**
     * Decodes a base64 encoded bitfield into an array of values, each of
     * which are in the provided options array.
     *
     * The ordering of the options array does not matter.
     *
     * This function is the inverse of the `pack` function from this module.
     *
     * @param {array} options
     *   An array of all possible options that might need to be encoded.
     * @param {string} data
     *   A base64 encoded string, generated from the `pack` function in
     *   this module.
     *
     * @return {array}
     *   An array of zero or more elements, each of which will be in the
     *   options array.
     */
    const unpack = function (options, data) {
        const binToBucketSizeFunc = binOptionsReduceFunction.bind(undefined, bucketSize);
        options.sort();

        const binnedOptions = options.reduce(binToBucketSizeFunc, []);
        const bitFields = base64StrToBuffer(data);

        const result = [];

        let i, j;

        for (i = 0; i < bitFields.length; i += 1) {
            const currentBitField = bitFields[i];
            const currentOptionsBin = binnedOptions[i];

            for (j = 0; j < bucketSize; j += 1) {
                if (currentBitField & (1 << j)) {
                    const currentOption = currentOptionsBin[j];
                    result.push(currentOption);
                }
            }
        }

        return result;
    };

    window.WEB_API_MANAGER.packingLib = {
        pack,
        unpack,
    };
}());

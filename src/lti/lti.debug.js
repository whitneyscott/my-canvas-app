"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.getLog = getLog;
exports.unknownToErrorMessage = unknownToErrorMessage;
var MAX = 30;
var entries = [];
function log(step, data) {
    var entry = {
        ts: new Date().toISOString(),
        step: step,
        data: data,
    };
    entries.unshift(entry);
    if (entries.length > MAX)
        entries.pop();
    console.log('[lti]', step, JSON.stringify(data));
}
function getLog() {
    return __spreadArray([], entries, true);
}
function unknownToErrorMessage(e) {
    if (e instanceof Error)
        return e.message;
    if (typeof e === 'string')
        return e;
    if (typeof e === 'number' || typeof e === 'boolean')
        return String(e);
    try {
        return JSON.stringify(e);
    }
    catch (_a) {
        return 'unknown error';
    }
}

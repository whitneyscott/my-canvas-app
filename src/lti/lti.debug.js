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
var MAX = 30;
var entries = [];
function log(step, data) {
    entries.unshift({
        ts: new Date().toISOString(),
        step: step,
        data: data,
    });
    if (entries.length > MAX)
        entries.pop();
}
function getLog() {
    return __spreadArray([], entries, true);
}

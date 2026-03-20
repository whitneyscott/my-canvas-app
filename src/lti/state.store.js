"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setState = setState;
exports.getState = getState;
var store = new Map();
var TTL_MS = 600000;
function setState(state, target, nonce) {
    store.set(state, { target: target, nonce: nonce });
    setTimeout(function () { return store.delete(state); }, TTL_MS);
}
function getState(state) {
    var v = store.get(state);
    if (v)
        store.delete(state);
    return v !== null && v !== void 0 ? v : null;
}

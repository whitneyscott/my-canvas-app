"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOAuthState = setOAuthState;
exports.getOAuthState = getOAuthState;
var store = new Map();
var TTL_MS = 600000;
function setOAuthState(state, returnUrl) {
    store.set(state, returnUrl);
    setTimeout(function () { return store.delete(state); }, TTL_MS);
}
function getOAuthState(state) {
    var v = store.get(state);
    if (v)
        store.delete(state);
    return v !== null && v !== void 0 ? v : null;
}

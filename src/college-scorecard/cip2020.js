"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCip6Options = getCip6Options;
var CIP4_TO_CIP6 = {
    '16.16': [
        {
            code: '16.1601',
            title: 'American Sign Language (ASL)/Langue des signes québécoise (LSQ)',
        },
        { code: '16.1602', title: 'Linguistics of ASL and Other Sign Languages' },
        { code: '16.1603', title: 'Sign Language Interpretation and Translation' },
    ],
};
function toCip4Key(s) {
    var t = String(s || '').trim();
    if (!t)
        return '';
    if (t.includes('.'))
        return t;
    var m = t.match(/^(\d{2})(\d{2})$/);
    return m ? "".concat(m[1], ".").concat(m[2]) : t;
}
function getCip6Options(cip4) {
    var _a;
    var key = toCip4Key(cip4);
    return key ? ((_a = CIP4_TO_CIP6[key]) !== null && _a !== void 0 ? _a : []) : [];
}

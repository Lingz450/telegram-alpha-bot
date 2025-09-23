"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseKV = parseKV;
function parseKV(input) {
    // key=value pairs -> { key: value }
    var out = {};
    for (var _i = 0, _a = input.split(/\s+/); _i < _a.length; _i++) {
        var part = _a[_i];
        var m = part.match(/^([a-zA-Z0-9_]+)=(.+)$/);
        if (m)
            out[m[1]] = m[2];
    }
    return out;
}

"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.renderHeatmap = renderHeatmap;
// src/charts/heatmapRenderer.ts
var puppeteer_1 = require("puppeteer");
function renderHeatmap(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var symbol, mode, ob, MAX_LEVELS, clean, bids, asks, maxBid, maxAsk, fmt, html, browser, page, buf, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    symbol = String((payload === null || payload === void 0 ? void 0 : payload.symbol) || "").toUpperCase();
                    mode = String((payload === null || payload === void 0 ? void 0 : payload.mode) || "standard").toLowerCase();
                    ob = (payload === null || payload === void 0 ? void 0 : payload.orderbook) || { bids: [], asks: [] };
                    if (!symbol)
                        throw new Error("renderHeatmap, missing symbol");
                    if (!Array.isArray(ob.bids) || !Array.isArray(ob.asks)) {
                        throw new Error("renderHeatmap, invalid orderbook");
                    }
                    MAX_LEVELS = mode === "extended" ? 60 : 30;
                    clean = function (rows) {
                        return rows
                            .filter(function (r) { return Array.isArray(r) && r.length >= 2; })
                            .map(function (_a) {
                            var p = _a[0], s = _a[1];
                            return [Number(p), Number(s)];
                        })
                            .filter(function (_a) {
                            var p = _a[0], s = _a[1];
                            return Number.isFinite(p) && Number.isFinite(s) && s > 0;
                        })
                            .slice(0, MAX_LEVELS);
                    };
                    bids = clean(ob.bids);
                    asks = clean(ob.asks);
                    if (bids.length === 0 && asks.length === 0) {
                        throw new Error("renderHeatmap, empty orderbook");
                    }
                    maxBid = Math.max.apply(Math, __spreadArray(__spreadArray([], bids.map(function (b) { return b[1]; }), false), [1], false));
                    maxAsk = Math.max.apply(Math, __spreadArray(__spreadArray([], asks.map(function (a) { return a[1]; }), false), [1], false));
                    fmt = function (v) {
                        return new Intl.NumberFormat("en-US", {
                            maximumFractionDigits: v < 1 ? 8 : 4,
                        }).format(v);
                    };
                    html = String.raw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\"/>\n  <style>\n    html, body { margin:0; padding:0; background:#0b0f14; }\n    #wrap { width: 900px; height: 420px; background:#0b0f14; color:#d0d7de; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }\n    .title { padding:10px 14px; font-weight:600; letter-spacing:.3px; font-size:14px; color:#c9d1d9; border-bottom:1px solid #1b2330;}\n    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px 14px; }\n    .col { background:#0f1520; padding:10px; border:1px solid #1b2330; border-radius:8px; overflow:hidden; }\n    .hdr { opacity:.75; margin-bottom:8px; font-size:12px; }\n    .row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 0; font-size:12px; }\n    .row span { white-space:nowrap; }\n    .bar { width:100%; height:8px; background:#122138; border-radius:999px; overflow:hidden; margin-top:3px; }\n    .fill { height:100%; }\n    .bid { background:#22c55e; }\n    .ask { background:#ef4444; }\n    .cells { display:grid; grid-template-columns: 100px 1fr 120px; align-items:center; gap:10px; }\n    .muted { color:#97a3b6; }\n  </style>\n</head>\n<body>\n  <div id=\"wrap\">\n    <div class=\"title\">", " \u00B7 Order Book ", "</div>\n    <div class=\"grid\">\n      <div class=\"col\" id=\"bids\"><div class=\"hdr\">Bids</div></div>\n      <div class=\"col\" id=\"asks\"><div class=\"hdr\">Asks</div></div>\n    </div>\n  </div>\n  <script>\n    // Data from Node\n    const bids = ", ";\n    const asks = ", ";\n    const maxBid = ", ";\n    const maxAsk = ", ";\n\n    function fmt(v){\n      try {\n        return new Intl.NumberFormat(\"en-US\", { maximumFractionDigits: v < 1 ? 8 : 4 }).format(v);\n      } catch(_){\n        return String(v);\n      }\n    }\n\n    function addRows(id, rows, max, cls) {\n      const root = document.getElementById(id);\n      rows.forEach(([price, size]) => {\n        const row = document.createElement('div'); \n        row.className = 'row';\n\n        const cells = document.createElement('div');\n        cells.className = 'cells';\n\n        const priceEl = document.createElement('span'); \n        priceEl.textContent = fmt(price);\n        const bar = document.createElement('div'); \n        bar.className = 'bar';\n        const fill = document.createElement('div'); \n        fill.className = 'fill ' + cls; \n        const pct = Math.max(0, Math.min(100, (size / max) * 100));\n        fill.style.width = pct.toFixed(2) + '%';\n        bar.appendChild(fill);\n\n        const sizeEl = document.createElement('span'); \n        sizeEl.className = 'muted';\n        sizeEl.textContent = fmt(size);\n\n        cells.appendChild(priceEl);\n        cells.appendChild(bar);\n        cells.appendChild(sizeEl);\n\n        row.appendChild(cells);\n        root.appendChild(row);\n      });\n    }\n\n    addRows('bids', bids, maxBid, 'bid');\n    addRows('asks', asks, maxAsk, 'ask');\n\n    // Signal ready to Node\n    window.__heatmapReady = true;\n  </script>\n</body>\n</html>"], ["<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\"/>\n  <style>\n    html, body { margin:0; padding:0; background:#0b0f14; }\n    #wrap { width: 900px; height: 420px; background:#0b0f14; color:#d0d7de; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }\n    .title { padding:10px 14px; font-weight:600; letter-spacing:.3px; font-size:14px; color:#c9d1d9; border-bottom:1px solid #1b2330;}\n    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px 14px; }\n    .col { background:#0f1520; padding:10px; border:1px solid #1b2330; border-radius:8px; overflow:hidden; }\n    .hdr { opacity:.75; margin-bottom:8px; font-size:12px; }\n    .row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 0; font-size:12px; }\n    .row span { white-space:nowrap; }\n    .bar { width:100%; height:8px; background:#122138; border-radius:999px; overflow:hidden; margin-top:3px; }\n    .fill { height:100%; }\n    .bid { background:#22c55e; }\n    .ask { background:#ef4444; }\n    .cells { display:grid; grid-template-columns: 100px 1fr 120px; align-items:center; gap:10px; }\n    .muted { color:#97a3b6; }\n  </style>\n</head>\n<body>\n  <div id=\"wrap\">\n    <div class=\"title\">", " \u00B7 Order Book ", "</div>\n    <div class=\"grid\">\n      <div class=\"col\" id=\"bids\"><div class=\"hdr\">Bids</div></div>\n      <div class=\"col\" id=\"asks\"><div class=\"hdr\">Asks</div></div>\n    </div>\n  </div>\n  <script>\n    // Data from Node\n    const bids = ", ";\n    const asks = ", ";\n    const maxBid = ", ";\n    const maxAsk = ", ";\n\n    function fmt(v){\n      try {\n        return new Intl.NumberFormat(\"en-US\", { maximumFractionDigits: v < 1 ? 8 : 4 }).format(v);\n      } catch(_){\n        return String(v);\n      }\n    }\n\n    function addRows(id, rows, max, cls) {\n      const root = document.getElementById(id);\n      rows.forEach(([price, size]) => {\n        const row = document.createElement('div'); \n        row.className = 'row';\n\n        const cells = document.createElement('div');\n        cells.className = 'cells';\n\n        const priceEl = document.createElement('span'); \n        priceEl.textContent = fmt(price);\n        const bar = document.createElement('div'); \n        bar.className = 'bar';\n        const fill = document.createElement('div'); \n        fill.className = 'fill ' + cls; \n        const pct = Math.max(0, Math.min(100, (size / max) * 100));\n        fill.style.width = pct.toFixed(2) + '%';\n        bar.appendChild(fill);\n\n        const sizeEl = document.createElement('span'); \n        sizeEl.className = 'muted';\n        sizeEl.textContent = fmt(size);\n\n        cells.appendChild(priceEl);\n        cells.appendChild(bar);\n        cells.appendChild(sizeEl);\n\n        row.appendChild(cells);\n        root.appendChild(row);\n      });\n    }\n\n    addRows('bids', bids, maxBid, 'bid');\n    addRows('asks', asks, maxAsk, 'ask');\n\n    // Signal ready to Node\n    window.__heatmapReady = true;\n  </script>\n</body>\n</html>"])), escapeHtml(symbol), escapeHtml(mode === "extended" ? "Extended" : "Standard"), JSON.stringify(bids), JSON.stringify(asks), JSON.stringify(maxBid), JSON.stringify(maxAsk));
                    browser = null;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 9, 14]);
                    return [4 /*yield*/, puppeteer_1.default.launch({
                            headless: "new",
                            args: ["--no-sandbox", "--disable-setuid-sandbox"],
                        })];
                case 2:
                    browser = _b.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    page = _b.sent();
                    return [4 /*yield*/, page.setViewport({ width: 900, height: 420, deviceScaleFactor: 1 })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 })];
                case 5:
                    _b.sent();
                    // Wait for the script to set readiness, then give layout a tick to paint
                    return [4 /*yield*/, page.waitForFunction("window.__heatmapReady === true", { timeout: 10000 })];
                case 6:
                    // Wait for the script to set readiness, then give layout a tick to paint
                    _b.sent();
                    return [4 /*yield*/, page.waitForTimeout(120)];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, page.screenshot({ type: "png" })];
                case 8:
                    buf = (_b.sent());
                    return [2 /*return*/, buf];
                case 9:
                    if (!browser) return [3 /*break*/, 13];
                    _b.label = 10;
                case 10:
                    _b.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, browser.close()];
                case 11:
                    _b.sent();
                    return [3 /*break*/, 13];
                case 12:
                    _a = _b.sent();
                    return [3 /*break*/, 13];
                case 13: return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var templateObject_1;

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderChart = renderChart;
// src/charts/chartRenderer.ts
var puppeteer_1 = require("puppeteer");
function renderChart(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var symbol, timeframe, candles, sorted, lcData, cleanData, html, browser, page, doc, safeHtml, buf, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    symbol = (payload.symbol || "").toUpperCase();
                    timeframe = String(payload.timeframe || "");
                    candles = Array.isArray(payload.candles) ? payload.candles : [];
                    if (!symbol || !timeframe || candles.length === 0) {
                        throw new Error("renderChart, invalid payload, missing symbol, timeframe, or candles");
                    }
                    sorted = candles
                        .slice()
                        .sort(function (a, b) { return a.t - b.t; })
                        .slice(-2000);
                    lcData = sorted.map(function (c) { return ({
                        time: Math.floor(c.t / 1000),
                        open: Number(c.o),
                        high: Number(c.h),
                        low: Number(c.l),
                        close: Number(c.c),
                    }); });
                    cleanData = lcData.filter(function (d) {
                        return Number.isFinite(d.open) &&
                            Number.isFinite(d.high) &&
                            Number.isFinite(d.low) &&
                            Number.isFinite(d.close) &&
                            Number.isFinite(d.time);
                    });
                    if (cleanData.length < 5) {
                        throw new Error("renderChart, not enough valid candles to render");
                    }
                    html = String.raw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\"/>\n  <style>\n    html, body { margin:0; padding:0; }\n    #wrap { width: 900px; height: 420px; background:#0b0f14; color:#d0d7de; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }\n    .title { padding:10px 14px; font-weight:600; letter-spacing:.3px; font-size:14px; color:#c9d1d9; }\n    #chart { width: 900px; height: 380px; }\n  </style>\n  <script src=\"https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js\"></script>\n</head>\n<body>\n  <div id=\"wrap\">\n    <div class=\"title\">", " \u00B7 ", "</div>\n    <div id=\"chart\"></div>\n  </div>\n  <script>\n    const data = ", ";\n    const { createChart, CrosshairMode } = LightweightCharts;\n    const el = document.getElementById('chart');\n\n    const chart = createChart(el, {\n      width: 900,\n      height: 380,\n      layout: { background: { type:'solid', color:'#0b0f14' }, textColor:'#c9d1d9' },\n      grid: { vertLines: { color:'#121826' }, horzLines: { color:'#121826' } },\n      crosshair: { mode: CrosshairMode.Magnet },\n      rightPriceScale: { borderColor: '#1f2a3a' },\n      timeScale: { borderColor: '#1f2a3a', rightOffset: 2, barSpacing: 6, fixLeftEdge: true }\n    });\n\n    const series = chart.addCandlestickSeries({\n      upColor:'#22c55e', downColor:'#ef4444',\n      borderUpColor:'#22c55e', borderDownColor:'#ef4444',\n      wickUpColor:'#22c55e', wickDownColor:'#ef4444'\n    });\n\n    series.setData(data);\n\n    // Nice autoscale after data set\n    chart.timeScale().fitContent();\n\n    // Signal ready to Node\n    window.__chartReady = true;\n  </script>\n</body>\n</html>"], ["<!doctype html>\n<html>\n<head>\n  <meta charset=\"utf-8\"/>\n  <style>\n    html, body { margin:0; padding:0; }\n    #wrap { width: 900px; height: 420px; background:#0b0f14; color:#d0d7de; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }\n    .title { padding:10px 14px; font-weight:600; letter-spacing:.3px; font-size:14px; color:#c9d1d9; }\n    #chart { width: 900px; height: 380px; }\n  </style>\n  <script src=\"https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js\"></script>\n</head>\n<body>\n  <div id=\"wrap\">\n    <div class=\"title\">", " \u00B7 ", "</div>\n    <div id=\"chart\"></div>\n  </div>\n  <script>\n    const data = ", ";\n    const { createChart, CrosshairMode } = LightweightCharts;\n    const el = document.getElementById('chart');\n\n    const chart = createChart(el, {\n      width: 900,\n      height: 380,\n      layout: { background: { type:'solid', color:'#0b0f14' }, textColor:'#c9d1d9' },\n      grid: { vertLines: { color:'#121826' }, horzLines: { color:'#121826' } },\n      crosshair: { mode: CrosshairMode.Magnet },\n      rightPriceScale: { borderColor: '#1f2a3a' },\n      timeScale: { borderColor: '#1f2a3a', rightOffset: 2, barSpacing: 6, fixLeftEdge: true }\n    });\n\n    const series = chart.addCandlestickSeries({\n      upColor:'#22c55e', downColor:'#ef4444',\n      borderUpColor:'#22c55e', borderDownColor:'#ef4444',\n      wickUpColor:'#22c55e', wickDownColor:'#ef4444'\n    });\n\n    series.setData(data);\n\n    // Nice autoscale after data set\n    chart.timeScale().fitContent();\n\n    // Signal ready to Node\n    window.__chartReady = true;\n  </script>\n</body>\n</html>"])), escapeHtml(symbol), escapeHtml(timeframe), JSON.stringify(cleanData));
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
                    doc = html.replace("function escapeHtml(str) { [native] }", "");
                    safeHtml = doc.replace("</head>", "<script>\n        function escapeHtml(s){\n          return String(s).replace(/&/g,\"&amp;\").replace(/</g,\"&lt;\").replace(/>/g,\"&gt;\");\n        }\n      </script></head>");
                    return [4 /*yield*/, page.setContent(safeHtml, { waitUntil: "networkidle0", timeout: 30000 })];
                case 5:
                    _b.sent();
                    // Wait for chart flag or timeout
                    return [4 /*yield*/, page.waitForFunction("window.__chartReady === true", { timeout: 10000 })];
                case 6:
                    // Wait for chart flag or timeout
                    _b.sent();
                    // Small delay to let rendering settle
                    return [4 /*yield*/, page.waitForTimeout(150)];
                case 7:
                    // Small delay to let rendering settle
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
// local helper so TypeScript compiles the template that references it
function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var templateObject_1;

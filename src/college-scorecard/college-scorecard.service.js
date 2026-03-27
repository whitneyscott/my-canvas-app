"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollegeScorecardService = void 0;
var common_1 = require("@nestjs/common");
var cip2020_1 = require("./cip2020");
var BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';
var CollegeScorecardService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CollegeScorecardService = _classThis = /** @class */ (function () {
        function CollegeScorecardService_1(config) {
            this.config = config;
        }
        CollegeScorecardService_1.prototype.getApiKey = function () {
            return this.config.get('COLLEGE_SCORECARD_API_KEY') || null;
        };
        CollegeScorecardService_1.prototype.fetchApi = function (params_1) {
            return __awaiter(this, arguments, void 0, function (params, retries) {
                var key, q, url, fullUrl, lastText, _loop_1, attempt, state_1;
                if (retries === void 0) { retries = 2; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            key = this.getApiKey();
                            if (!key) {
                                console.log('[CollegeScorecard] fetchApi: no API key');
                                return [2 /*return*/, {
                                        results: [],
                                        error: 'College Scorecard API key is not configured.',
                                    }];
                            }
                            q = new URLSearchParams(__assign({ api_key: key, per_page: '100' }, params));
                            url = "".concat(BASE, "?").concat(q.toString().replace(/api_key=[^&]+/, 'api_key=***'));
                            console.log('[CollegeScorecard] fetchApi URL:', url);
                            fullUrl = "".concat(BASE, "?").concat(q);
                            lastText = '';
                            _loop_1 = function (attempt) {
                                var delay_1, res, parsed, data, rawResults, results, errField, isRetryable, msg;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!(attempt > 0)) return [3 /*break*/, 2];
                                            delay_1 = attempt * 800;
                                            console.log('[CollegeScorecard] retry in', delay_1, 'ms');
                                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, delay_1); })];
                                        case 1:
                                            _b.sent();
                                            _b.label = 2;
                                        case 2: return [4 /*yield*/, fetch(fullUrl)];
                                        case 3:
                                            res = _b.sent();
                                            return [4 /*yield*/, res.text()];
                                        case 4:
                                            lastText = _b.sent();
                                            if (res.ok) {
                                                try {
                                                    parsed = JSON.parse(lastText);
                                                    data = parsed &&
                                                        typeof parsed === 'object' &&
                                                        !Array.isArray(parsed) &&
                                                        parsed
                                                        ? parsed
                                                        : null;
                                                    rawResults = data === null || data === void 0 ? void 0 : data.results;
                                                    results = Array.isArray(rawResults) ? rawResults : [];
                                                    errField = data === null || data === void 0 ? void 0 : data.error;
                                                    console.log('[CollegeScorecard] fetchApi response: results count=', results.length);
                                                    return [2 /*return*/, { value: __assign({ results: results }, (typeof errField === 'string' ? { error: errField } : {})) }];
                                                }
                                                catch (_c) {
                                                    return [2 /*return*/, { value: {
                                                                results: [],
                                                                error: 'Invalid response from College Scorecard.',
                                                            } }];
                                                }
                                            }
                                            console.log('[CollegeScorecard] fetchApi error:', res.status, lastText.slice(0, 300));
                                            isRetryable = [500, 502, 503].includes(res.status) && attempt < retries;
                                            if (!isRetryable) {
                                                msg = res.status === 429
                                                    ? 'Too many requests. Try again in a moment.'
                                                    : res.status >= 500
                                                        ? 'College Scorecard service is temporarily unavailable. Try again shortly.'
                                                        : lastText.toLowerCase().includes('api key') ||
                                                            lastText.toLowerCase().includes('apikey')
                                                            ? 'API key problem. Check COLLEGE_SCORECARD_API_KEY in .env.'
                                                            : "Request failed (".concat(res.status, ").");
                                                return [2 /*return*/, { value: { results: [], error: msg } }];
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            attempt = 0;
                            _a.label = 1;
                        case 1:
                            if (!(attempt <= retries)) return [3 /*break*/, 4];
                            return [5 /*yield**/, _loop_1(attempt)];
                        case 2:
                            state_1 = _a.sent();
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                            _a.label = 3;
                        case 3:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, {
                                results: [],
                                error: 'College Scorecard service is temporarily unavailable. Try again shortly.',
                            }];
                    }
                });
            });
        };
        CollegeScorecardService_1.prototype.getCitiesByState = function (state) {
            return __awaiter(this, void 0, void 0, function () {
                var stateTrim, cities, page, perPage, hasMore, data, results;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            stateTrim = (state || '').trim().toUpperCase().slice(0, 2);
                            if (!stateTrim)
                                return [2 /*return*/, []];
                            cities = new Set();
                            page = 0;
                            perPage = 100;
                            hasMore = true;
                            _a.label = 1;
                        case 1:
                            if (!hasMore) return [3 /*break*/, 5];
                            if (!(page > 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 150); })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [4 /*yield*/, this.fetchApi({
                                'school.state': stateTrim,
                                fields: 'id,school.city',
                                page: String(page),
                                per_page: String(perPage),
                            })];
                        case 4:
                            data = _a.sent();
                            if (data.error)
                                return [2 /*return*/, { error: data.error }];
                            results = data.results || [];
                            results.forEach(function (r) {
                                var _a;
                                if (!r || typeof r !== 'object')
                                    return;
                                var rec = r;
                                var school = rec.school;
                                var nestedCity = school && typeof school === 'object' && !Array.isArray(school)
                                    ? school.city
                                    : undefined;
                                var c = (_a = rec['school.city']) !== null && _a !== void 0 ? _a : nestedCity;
                                if (c && typeof c === 'string')
                                    cities.add(c.trim());
                            });
                            hasMore = results.length >= perPage;
                            page++;
                            return [3 /*break*/, 1];
                        case 5: return [2 /*return*/, Array.from(cities).sort()];
                    }
                });
            });
        };
        CollegeScorecardService_1.prototype.getInstitutionsByStateCity = function (state, city) {
            return __awaiter(this, void 0, void 0, function () {
                var stateTrim, cityTrim, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            stateTrim = (state || '').trim().toUpperCase().slice(0, 2);
                            cityTrim = (city || '').trim();
                            if (!stateTrim || !cityTrim)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, this.fetchApi({
                                    'school.state': stateTrim,
                                    'school.city': cityTrim,
                                    fields: 'id,school.name',
                                })];
                        case 1:
                            data = _a.sent();
                            if (data.error)
                                return [2 /*return*/, { error: data.error }];
                            return [2 /*return*/, (data.results || [])
                                    .filter(function (r) {
                                    var _a;
                                    if (!r || typeof r !== 'object')
                                        return false;
                                    var rec = r;
                                    var school = rec.school;
                                    var nestedName = school && typeof school === 'object' && !Array.isArray(school)
                                        ? school.name
                                        : undefined;
                                    var name = (_a = rec['school.name']) !== null && _a !== void 0 ? _a : nestedName;
                                    return rec.id != null && name;
                                })
                                    .map(function (r) {
                                    var _a;
                                    var rec = r;
                                    var school = rec.school;
                                    var nestedName = school && typeof school === 'object' && !Array.isArray(school)
                                        ? school.name
                                        : undefined;
                                    var rawName = (_a = rec['school.name']) !== null && _a !== void 0 ? _a : nestedName;
                                    var nameStr = typeof rawName === 'string'
                                        ? rawName
                                        : rawName != null &&
                                            (typeof rawName === 'number' || typeof rawName === 'boolean')
                                            ? String(rawName)
                                            : '';
                                    return {
                                        id: Number(rec.id),
                                        name: nameStr.trim(),
                                    };
                                })
                                    .sort(function (a, b) { return a.name.localeCompare(b.name); })];
                    }
                });
            });
        };
        CollegeScorecardService_1.prototype.getProgramsBySchoolId = function (schoolId) {
            return __awaiter(this, void 0, void 0, function () {
                var titles, page, perPage, hasMore, _loop_2, this_1, state_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!schoolId)
                                return [2 /*return*/, []];
                            titles = new Set();
                            page = 0;
                            perPage = 100;
                            hasMore = true;
                            _loop_2 = function () {
                                var data, results, extract;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!(page > 0)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 150); })];
                                        case 1:
                                            _b.sent();
                                            _b.label = 2;
                                        case 2: return [4 /*yield*/, this_1.fetchApi({
                                                id: String(schoolId),
                                                fields: 'latest.programs.cip_4_digit,latest.programs.cip_6_digit',
                                                page: String(page),
                                                per_page: String(perPage),
                                            })];
                                        case 3:
                                            data = _b.sent();
                                            if (data.error)
                                                return [2 /*return*/, { value: { error: data.error } }];
                                            results = data.results || [];
                                            extract = function (raw) {
                                                var _a;
                                                if (Array.isArray(raw)) {
                                                    raw.forEach(function (p) {
                                                        var _a;
                                                        if (!p || typeof p !== 'object')
                                                            return;
                                                        var pr = p;
                                                        var t = (_a = pr.title) !== null && _a !== void 0 ? _a : pr['title'];
                                                        if (t && typeof t === 'string')
                                                            titles.add(String(t).trim());
                                                    });
                                                }
                                                else if (raw && typeof raw === 'object') {
                                                    var ro = raw;
                                                    var t = (_a = ro.title) !== null && _a !== void 0 ? _a : ro['title'];
                                                    if (t && typeof t === 'string')
                                                        titles.add(String(t).trim());
                                                }
                                            };
                                            results.forEach(function (r) {
                                                var _a, _b;
                                                if (r && typeof r === 'object') {
                                                    var rec = r;
                                                    var latest = rec.latest;
                                                    var lat = latest && typeof latest === 'object' && !Array.isArray(latest)
                                                        ? latest
                                                        : undefined;
                                                    var programs = lat === null || lat === void 0 ? void 0 : lat.programs;
                                                    extract((_a = rec['latest.programs.cip_4_digit']) !== null && _a !== void 0 ? _a : programs === null || programs === void 0 ? void 0 : programs.cip_4_digit);
                                                    extract((_b = rec['latest.programs.cip_6_digit']) !== null && _b !== void 0 ? _b : programs === null || programs === void 0 ? void 0 : programs.cip_6_digit);
                                                }
                                            });
                                            hasMore = results.length >= perPage;
                                            page++;
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            _a.label = 1;
                        case 1:
                            if (!hasMore) return [3 /*break*/, 3];
                            return [5 /*yield**/, _loop_2()];
                        case 2:
                            state_2 = _a.sent();
                            if (typeof state_2 === "object")
                                return [2 /*return*/, state_2.value];
                            return [3 /*break*/, 1];
                        case 3: return [2 /*return*/, Array.from(titles).sort()];
                    }
                });
            });
        };
        CollegeScorecardService_1.prototype.getProgramsCip4BySchoolId = function (schoolId) {
            return __awaiter(this, void 0, void 0, function () {
                var seen, page, perPage, hasMore, data, results;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!schoolId)
                                return [2 /*return*/, []];
                            seen = new Map();
                            page = 0;
                            perPage = 100;
                            hasMore = true;
                            _a.label = 1;
                        case 1:
                            if (!hasMore) return [3 /*break*/, 5];
                            if (!(page > 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 150); })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [4 /*yield*/, this.fetchApi({
                                id: String(schoolId),
                                fields: 'latest.programs.cip_4_digit',
                                page: String(page),
                                per_page: String(perPage),
                            })];
                        case 4:
                            data = _a.sent();
                            if (data.error)
                                return [2 /*return*/, { error: data.error }];
                            results = data.results || [];
                            results.forEach(function (r) {
                                var _a;
                                if (!r || typeof r !== 'object')
                                    return;
                                var rec = r;
                                var latest = rec.latest;
                                var lat = latest && typeof latest === 'object' && !Array.isArray(latest)
                                    ? latest
                                    : undefined;
                                var programs = lat === null || lat === void 0 ? void 0 : lat.programs;
                                var raw = (_a = rec['latest.programs.cip_4_digit']) !== null && _a !== void 0 ? _a : programs === null || programs === void 0 ? void 0 : programs.cip_4_digit;
                                var arr = Array.isArray(raw)
                                    ? raw
                                    : raw && typeof raw === 'object'
                                        ? [raw]
                                        : [];
                                arr.forEach(function (p) {
                                    var _a, _b, _c;
                                    if (!p || typeof p !== 'object')
                                        return;
                                    var pr = p;
                                    var code = (_b = (_a = pr.code) !== null && _a !== void 0 ? _a : pr.cip4) !== null && _b !== void 0 ? _b : pr['cip4'];
                                    var title = (_c = pr.title) !== null && _c !== void 0 ? _c : pr['title'];
                                    if (code != null && title && typeof title === 'string') {
                                        var cip4 = typeof code === 'string'
                                            ? code.trim()
                                            : typeof code === 'number' || typeof code === 'boolean'
                                                ? String(code).trim()
                                                : '';
                                        if (cip4 && !seen.has(cip4))
                                            seen.set(cip4, String(title).trim());
                                    }
                                });
                            });
                            hasMore = results.length >= perPage;
                            page++;
                            return [3 /*break*/, 1];
                        case 5: return [2 /*return*/, Array.from(seen.entries())
                                .map(function (_a) {
                                var cip4 = _a[0], title = _a[1];
                                return ({ cip4: cip4, title: title });
                            })
                                .sort(function (a, b) { return a.title.localeCompare(b.title); })];
                    }
                });
            });
        };
        CollegeScorecardService_1.prototype.getCip6OptionsForCip4 = function (cip4) {
            return { options: (0, cip2020_1.getCip6Options)(cip4) };
        };
        return CollegeScorecardService_1;
    }());
    __setFunctionName(_classThis, "CollegeScorecardService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CollegeScorecardService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CollegeScorecardService = _classThis;
}();
exports.CollegeScorecardService = CollegeScorecardService;

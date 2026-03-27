"use strict";
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
exports.AutomatedTestService = void 0;
var common_1 = require("@nestjs/common");
var test_registry_config_1 = require("../config/test-registry.config");
var AutomatedTestService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AutomatedTestService = _classThis = /** @class */ (function () {
        function AutomatedTestService_1() {
        }
        AutomatedTestService_1.prototype.unknownToMessage = function (e) {
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
        };
        AutomatedTestService_1.prototype.canvasItemNamePart = function (v) {
            if (typeof v === 'string')
                return v;
            if (typeof v === 'number' || typeof v === 'boolean')
                return String(v);
            return '';
        };
        AutomatedTestService_1.prototype.getAuthHeaders = function () {
            var token = process.env.CANVAS_TOKEN;
            var baseUrl = process.env.CANVAS_BASE_URL;
            if (!token || !baseUrl) {
                throw new Error('Missing CANVAS_TOKEN or CANVAS_BASE_URL in .env file');
            }
            return { token: token, baseUrl: baseUrl };
        };
        AutomatedTestService_1.prototype.fetchPaginatedData = function (url, token) {
            return __awaiter(this, void 0, void 0, function () {
                var allData, currentUrl, response, chunk, _i, chunk_1, el, linkHeader, nextMatch;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            allData = [];
                            currentUrl = url;
                            _a.label = 1;
                        case 1:
                            if (!currentUrl) return [3 /*break*/, 4];
                            return [4 /*yield*/, fetch(currentUrl, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _a.sent();
                            if (!response.ok) {
                                throw new Error("Failed to fetch: ".concat(response.status, " ").concat(response.statusText));
                            }
                            return [4 /*yield*/, response.json()];
                        case 3:
                            chunk = _a.sent();
                            if (Array.isArray(chunk)) {
                                for (_i = 0, chunk_1 = chunk; _i < chunk_1.length; _i++) {
                                    el = chunk_1[_i];
                                    allData.push(el);
                                }
                            }
                            else if (chunk !== null && chunk !== undefined) {
                                allData.push(chunk);
                            }
                            linkHeader = response.headers.get('link');
                            if (linkHeader) {
                                nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                                currentUrl = nextMatch ? nextMatch[1] : null;
                            }
                            else {
                                currentUrl = null;
                            }
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, allData];
                    }
                });
            });
        };
        AutomatedTestService_1.prototype.findExistingExampleItems = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, existingItems, _loop_1, this_1, _i, _b, type;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _a = this.getAuthHeaders(), token = _a.token, baseUrl = _a.baseUrl;
                            existingItems = [];
                            _loop_1 = function (type) {
                                var items, url, url, url, url, url, url, exampleItems, err_1;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            _d.trys.push([0, 13, , 14]);
                                            items = [];
                                            if (!(type === 'assignments')) return [3 /*break*/, 2];
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100");
                                            return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                        case 1:
                                            items = _d.sent();
                                            return [3 /*break*/, 12];
                                        case 2:
                                            if (!(type === 'quizzes')) return [3 /*break*/, 4];
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes?per_page=100");
                                            return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                        case 3:
                                            items = _d.sent();
                                            return [3 /*break*/, 12];
                                        case 4:
                                            if (!(type === 'pages')) return [3 /*break*/, 6];
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/pages?per_page=100");
                                            return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                        case 5:
                                            items = _d.sent();
                                            return [3 /*break*/, 12];
                                        case 6:
                                            if (!(type === 'discussions')) return [3 /*break*/, 8];
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?per_page=100");
                                            return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                        case 7:
                                            items = _d.sent();
                                            return [3 /*break*/, 12];
                                        case 8:
                                            if (!(type === 'announcements')) return [3 /*break*/, 10];
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?only_announcements=true&per_page=100");
                                            return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                        case 9:
                                            items = _d.sent();
                                            return [3 /*break*/, 12];
                                        case 10:
                                            if (!(type === 'modules')) return [3 /*break*/, 12];
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/modules?per_page=100");
                                            return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                        case 11:
                                            items = _d.sent();
                                            _d.label = 12;
                                        case 12:
                                            exampleItems = items.filter(function (item) {
                                                var _a, _b;
                                                if (!item || typeof item !== 'object')
                                                    return false;
                                                var rec = item;
                                                var nameRaw = (_b = (_a = rec.name) !== null && _a !== void 0 ? _a : rec.title) !== null && _b !== void 0 ? _b : rec.url;
                                                var name = _this.canvasItemNamePart(nameRaw);
                                                return name.startsWith('Example');
                                            });
                                            exampleItems.forEach(function (item) {
                                                var _a, _b;
                                                if (!item || typeof item !== 'object')
                                                    return;
                                                var rec = item;
                                                var nameRaw = (_b = (_a = rec.name) !== null && _a !== void 0 ? _a : rec.title) !== null && _b !== void 0 ? _b : rec.url;
                                                var name = _this.canvasItemNamePart(nameRaw) || 'Unknown';
                                                var idRaw = type === 'pages' ? rec.url : rec.id;
                                                existingItems.push({
                                                    type: type,
                                                    id: idRaw,
                                                    name: name,
                                                });
                                            });
                                            return [3 /*break*/, 14];
                                        case 13:
                                            err_1 = _d.sent();
                                            console.error("Error checking for existing ".concat(type, " items:"), err_1);
                                            return [3 /*break*/, 14];
                                        case 14: return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            _i = 0, _b = Object.entries(test_registry_config_1.TEST_CONFIG);
                            _c.label = 1;
                        case 1:
                            if (!(_i < _b.length)) return [3 /*break*/, 4];
                            type = _b[_i][0];
                            return [5 /*yield**/, _loop_1(type)];
                        case 2:
                            _c.sent();
                            _c.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, existingItems];
                    }
                });
            });
        };
        AutomatedTestService_1.prototype.deleteExampleItems = function (courseId, itemsToDelete) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, results, _i, itemsToDelete_1, item, config, deleteUrl, response, errorText, errorMsg, err_2, errorMsg;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.getAuthHeaders(), token = _a.token, baseUrl = _a.baseUrl;
                            results = [];
                            _i = 0, itemsToDelete_1 = itemsToDelete;
                            _b.label = 1;
                        case 1:
                            if (!(_i < itemsToDelete_1.length)) return [3 /*break*/, 9];
                            item = itemsToDelete_1[_i];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 7, , 8]);
                            config = test_registry_config_1.TEST_CONFIG[item.type];
                            if (!(config === null || config === void 0 ? void 0 : config.deletePath)) {
                                results.push({
                                    type: item.type,
                                    id: item.id,
                                    success: false,
                                    error: config ? 'Unsupported type' : 'Unknown type',
                                });
                                return [3 /*break*/, 8];
                            }
                            deleteUrl = "".concat(baseUrl).concat(config.deletePath(courseId, item.id));
                            return [4 /*yield*/, fetch(deleteUrl, {
                                    method: 'DELETE',
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 3:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 5];
                            return [4 /*yield*/, response.text()];
                        case 4:
                            errorText = _b.sent();
                            errorMsg = "".concat(response.status, " ").concat(response.statusText, ": ").concat(errorText);
                            console.error("Failed to delete ".concat(item.type, " ").concat(item.id, ": ").concat(errorMsg));
                            results.push({
                                type: item.type,
                                id: item.id,
                                success: false,
                                error: errorMsg,
                            });
                            return [3 /*break*/, 6];
                        case 5:
                            results.push({ type: item.type, id: item.id, success: true });
                            _b.label = 6;
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            err_2 = _b.sent();
                            errorMsg = this.unknownToMessage(err_2);
                            console.error("Error deleting ".concat(item.type, " ").concat(item.id, ":"), errorMsg);
                            results.push({
                                type: item.type,
                                id: item.id,
                                success: false,
                                error: errorMsg,
                            });
                            return [3 /*break*/, 8];
                        case 8:
                            _i++;
                            return [3 /*break*/, 1];
                        case 9: return [2 /*return*/, results];
                    }
                });
            });
        };
        AutomatedTestService_1.prototype.runTests = function (courseId_1) {
            return __awaiter(this, arguments, void 0, function (courseId, deleteExisting) {
                var results, _a, token, baseUrl, existingItems, deleteResults, failed, _i, _b, _c, type, config, createData, createUrl, createdItem, createdId, createResponse, errorText, cr, idRaw, createError_1, _d, _e, param, updateValue, updateBody, updateUrl, updateResponse, errorText, updateError_1, typeError_1;
                if (deleteExisting === void 0) { deleteExisting = false; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            results = [];
                            _a = this.getAuthHeaders(), token = _a.token, baseUrl = _a.baseUrl;
                            if (!deleteExisting) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.findExistingExampleItems(courseId)];
                        case 1:
                            existingItems = _f.sent();
                            if (!(existingItems.length > 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.deleteExampleItems(courseId, existingItems)];
                        case 2:
                            deleteResults = _f.sent();
                            failed = deleteResults.filter(function (r) { return !r.success; });
                            if (failed.length > 0) {
                                console.warn("Failed to delete ".concat(failed.length, " items:"), failed);
                            }
                            // Wait a moment for deletions to complete
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                        case 3:
                            // Wait a moment for deletions to complete
                            _f.sent();
                            _f.label = 4;
                        case 4:
                            _i = 0, _b = Object.entries(test_registry_config_1.TEST_CONFIG);
                            _f.label = 5;
                        case 5:
                            if (!(_i < _b.length)) return [3 /*break*/, 25];
                            _c = _b[_i], type = _c[0], config = _c[1];
                            _f.label = 6;
                        case 6:
                            _f.trys.push([6, 23, , 24]);
                            createData = this.getCreateDataForType(type);
                            createUrl = "".concat(baseUrl).concat(config.createPath(courseId));
                            createdItem = void 0;
                            createdId = void 0;
                            _f.label = 7;
                        case 7:
                            _f.trys.push([7, 12, , 13]);
                            return [4 /*yield*/, fetch(createUrl, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(createData),
                                })];
                        case 8:
                            createResponse = _f.sent();
                            if (!!createResponse.ok) return [3 /*break*/, 10];
                            return [4 /*yield*/, createResponse.text()];
                        case 9:
                            errorText = _f.sent();
                            results.push({
                                endpoint: "".concat(type, " (create)"),
                                parameter: 'create',
                                result: 'failed',
                                errorMessage: "".concat(createResponse.status, " ").concat(createResponse.statusText, ": ").concat(errorText),
                            });
                            return [3 /*break*/, 24]; // Skip this type if creation failed
                        case 10: return [4 /*yield*/, createResponse.json()];
                        case 11:
                            createdItem = _f.sent();
                            if (!createdItem || typeof createdItem !== 'object') {
                                results.push({
                                    endpoint: "".concat(type, " (create)"),
                                    parameter: 'create',
                                    result: 'failed',
                                    errorMessage: 'Invalid create response',
                                });
                                return [3 /*break*/, 24];
                            }
                            cr = createdItem;
                            idRaw = type === 'pages' ? cr.url : cr.id;
                            createdId = idRaw;
                            results.push({
                                endpoint: "".concat(type, " (create)"),
                                parameter: 'create',
                                result: 'success',
                            });
                            return [3 /*break*/, 13];
                        case 12:
                            createError_1 = _f.sent();
                            results.push({
                                endpoint: "".concat(type, " (create)"),
                                parameter: 'create',
                                result: 'failed',
                                errorMessage: this.unknownToMessage(createError_1),
                            });
                            return [3 /*break*/, 24]; // Skip this type if creation failed
                        case 13:
                            _d = 0, _e = config.params;
                            _f.label = 14;
                        case 14:
                            if (!(_d < _e.length)) return [3 /*break*/, 22];
                            param = _e[_d];
                            _f.label = 15;
                        case 15:
                            _f.trys.push([15, 20, , 21]);
                            updateValue = this.getUpdateDataForParameter(param, type);
                            updateBody = this.getUpdateBodyForType(type, updateValue);
                            updateUrl = "".concat(baseUrl).concat(config.updatePath(courseId, createdId));
                            return [4 /*yield*/, fetch(updateUrl, {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(updateBody),
                                })];
                        case 16:
                            updateResponse = _f.sent();
                            if (!!updateResponse.ok) return [3 /*break*/, 18];
                            return [4 /*yield*/, updateResponse.text()];
                        case 17:
                            errorText = _f.sent();
                            results.push({
                                endpoint: type,
                                parameter: param,
                                result: 'failed',
                                errorMessage: "".concat(updateResponse.status, " ").concat(updateResponse.statusText, ": ").concat(errorText),
                            });
                            return [3 /*break*/, 19];
                        case 18:
                            results.push({
                                endpoint: type,
                                parameter: param,
                                result: 'success',
                            });
                            _f.label = 19;
                        case 19: return [3 /*break*/, 21];
                        case 20:
                            updateError_1 = _f.sent();
                            results.push({
                                endpoint: type,
                                parameter: param,
                                result: 'failed',
                                errorMessage: this.unknownToMessage(updateError_1),
                            });
                            return [3 /*break*/, 21];
                        case 21:
                            _d++;
                            return [3 /*break*/, 14];
                        case 22: return [3 /*break*/, 24];
                        case 23:
                            typeError_1 = _f.sent();
                            results.push({
                                endpoint: type,
                                parameter: 'all',
                                result: 'failed',
                                errorMessage: this.unknownToMessage(typeError_1),
                            });
                            return [3 /*break*/, 24];
                        case 24:
                            _i++;
                            return [3 /*break*/, 5];
                        case 25: return [2 /*return*/, results];
                    }
                });
            });
        };
        AutomatedTestService_1.prototype.getExpectedNameForType = function (type) {
            return "Example ".concat(type.charAt(0).toUpperCase() + type.slice(1));
        };
        AutomatedTestService_1.prototype.getCreateDataForType = function (type) {
            var baseName = this.getExpectedNameForType(type);
            switch (type) {
                case 'assignments':
                    return { assignment: { name: baseName } };
                case 'quizzes':
                    return { quiz: { title: baseName } };
                case 'pages':
                    return { wiki_page: { title: baseName, body: 'Test content' } };
                case 'discussions':
                    return { title: baseName, message: 'Test discussion' };
                case 'announcements':
                    return {
                        title: baseName,
                        message: 'Test announcement',
                        is_announcement: true,
                    };
                case 'modules':
                    return { module: { name: baseName } };
                default:
                    return {};
            }
        };
        AutomatedTestService_1.prototype.getUpdateBodyForType = function (type, updateData) {
            // Wrap in appropriate object for Canvas API based on type
            if (type === 'assignments') {
                return { assignment: updateData };
            }
            else if (type === 'quizzes') {
                return { quiz: updateData };
            }
            else if (type === 'modules') {
                return { module: updateData };
            }
            else {
                // discussions, pages, announcements use direct format
                return updateData;
            }
        };
        AutomatedTestService_1.prototype.getUpdateDataForParameter = function (param, type) {
            // Return test values based on parameter type (without wrapping)
            var updateValue = {};
            switch (param) {
                case 'name':
                case 'title': {
                    var expectedName = this.getExpectedNameForType(type);
                    updateValue[param] = "".concat(expectedName, " - Updated ").concat(param);
                    break;
                }
                case 'description':
                case 'message':
                case 'body':
                    updateValue[param] = 'Updated content';
                    break;
                case 'points_possible':
                case 'time_limit':
                case 'position':
                    updateValue[param] = 100;
                    break;
                case 'due_at':
                case 'unlock_at':
                case 'lock_at':
                case 'publish_at':
                case 'delayed_post_at':
                case 'show_correct_answers_at':
                case 'hide_correct_answers_at':
                    updateValue[param] = new Date().toISOString();
                    break;
                case 'published':
                case 'shuffle_answers':
                case 'require_sequential_progress':
                    updateValue[param] = true;
                    break;
                case 'discussion_type':
                    updateValue[param] = 'threaded';
                    break;
                case 'allow_rating':
                    updateValue[param] = true;
                    break;
                case 'editing_roles':
                    updateValue[param] = 'teachers';
                    break;
                default:
                    updateValue[param] = 'test_value';
            }
            return updateValue;
        };
        return AutomatedTestService_1;
    }());
    __setFunctionName(_classThis, "AutomatedTestService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AutomatedTestService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AutomatedTestService = _classThis;
}();
exports.AutomatedTestService = AutomatedTestService;

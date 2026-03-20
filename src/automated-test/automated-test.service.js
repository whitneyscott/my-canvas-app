"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.AutomatedTestService = void 0;
var common_1 = require("@nestjs/common");
var test_registry_config_1 = require("../config/test-registry.config");
var AutomatedTestService = /** @class */ (function () {
    function AutomatedTestService() {
    }
    AutomatedTestService.prototype.getAuthHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token, baseUrl;
            return __generator(this, function (_a) {
                token = process.env.CANVAS_TOKEN;
                baseUrl = process.env.CANVAS_BASE_URL;
                if (!token || !baseUrl) {
                    throw new Error('Missing CANVAS_TOKEN or CANVAS_BASE_URL in .env file');
                }
                return [2 /*return*/, { token: token, baseUrl: baseUrl }];
            });
        });
    };
    AutomatedTestService.prototype.fetchPaginatedData = function (url, token) {
        return __awaiter(this, void 0, void 0, function () {
            var allData, currentUrl, response, chunk, linkHeader, nextMatch;
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
                            allData.push.apply(allData, chunk);
                        }
                        else if (chunk) {
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
    AutomatedTestService.prototype.findExistingExampleItems = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, existingItems, _loop_1, this_1, _i, _b, _c, type, config;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _d.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        existingItems = [];
                        _loop_1 = function (type, config) {
                            var items, url, url, url, url, url, url, exampleItems, error_1;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        _e.trys.push([0, 13, , 14]);
                                        items = [];
                                        if (!(type === 'assignments')) return [3 /*break*/, 2];
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100");
                                        return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                    case 1:
                                        items = _e.sent();
                                        return [3 /*break*/, 12];
                                    case 2:
                                        if (!(type === 'quizzes')) return [3 /*break*/, 4];
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes?per_page=100");
                                        return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                    case 3:
                                        items = _e.sent();
                                        return [3 /*break*/, 12];
                                    case 4:
                                        if (!(type === 'pages')) return [3 /*break*/, 6];
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/pages?per_page=100");
                                        return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                    case 5:
                                        items = _e.sent();
                                        return [3 /*break*/, 12];
                                    case 6:
                                        if (!(type === 'discussions')) return [3 /*break*/, 8];
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?per_page=100");
                                        return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                    case 7:
                                        items = _e.sent();
                                        return [3 /*break*/, 12];
                                    case 8:
                                        if (!(type === 'announcements')) return [3 /*break*/, 10];
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?only_announcements=true&per_page=100");
                                        return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                    case 9:
                                        items = _e.sent();
                                        return [3 /*break*/, 12];
                                    case 10:
                                        if (!(type === 'modules')) return [3 /*break*/, 12];
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/modules?per_page=100");
                                        return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                    case 11:
                                        items = _e.sent();
                                        _e.label = 12;
                                    case 12:
                                        exampleItems = items.filter(function (item) {
                                            var name = item.name || item.title || item.url || '';
                                            return name.startsWith('Example');
                                        });
                                        exampleItems.forEach(function (item) {
                                            existingItems.push({
                                                type: type,
                                                id: type === 'pages' ? item.url : item.id,
                                                name: item.name || item.title || item.url || 'Unknown',
                                            });
                                        });
                                        return [3 /*break*/, 14];
                                    case 13:
                                        error_1 = _e.sent();
                                        // Log error but continue checking other types
                                        console.error("Error checking for existing ".concat(type, " items:"), error_1);
                                        return [3 /*break*/, 14];
                                    case 14: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _b = Object.entries(test_registry_config_1.TEST_CONFIG);
                        _d.label = 2;
                    case 2:
                        if (!(_i < _b.length)) return [3 /*break*/, 5];
                        _c = _b[_i], type = _c[0], config = _c[1];
                        return [5 /*yield**/, _loop_1(type, config)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, existingItems];
                }
            });
        });
    };
    AutomatedTestService.prototype.deleteExampleItems = function (courseId, itemsToDelete) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, results, _i, itemsToDelete_1, item, config, deleteUrl, response, errorText, errorMsg, error_2, errorMsg;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        _i = 0, itemsToDelete_1 = itemsToDelete;
                        _b.label = 2;
                    case 2:
                        if (!(_i < itemsToDelete_1.length)) return [3 /*break*/, 10];
                        item = itemsToDelete_1[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 8, , 9]);
                        config = test_registry_config_1.TEST_CONFIG[item.type];
                        if (!config) {
                            results.push({ type: item.type, id: item.id, success: false, error: 'Unknown type' });
                            return [3 /*break*/, 9];
                        }
                        deleteUrl = void 0;
                        if (item.type === 'pages') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(item.id));
                        }
                        else if (item.type === 'assignments') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(item.id);
                        }
                        else if (item.type === 'quizzes') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(item.id);
                        }
                        else if (item.type === 'discussions' || item.type === 'announcements') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(item.id);
                        }
                        else if (item.type === 'modules') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(item.id);
                        }
                        else {
                            results.push({ type: item.type, id: item.id, success: false, error: 'Unsupported type' });
                            return [3 /*break*/, 9];
                        }
                        return [4 /*yield*/, fetch(deleteUrl, {
                                method: 'DELETE',
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 4:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, response.text()];
                    case 5:
                        errorText = _b.sent();
                        errorMsg = "".concat(response.status, " ").concat(response.statusText, ": ").concat(errorText);
                        console.error("Failed to delete ".concat(item.type, " ").concat(item.id, ": ").concat(errorMsg));
                        results.push({ type: item.type, id: item.id, success: false, error: errorMsg });
                        return [3 /*break*/, 7];
                    case 6:
                        results.push({ type: item.type, id: item.id, success: true });
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_2 = _b.sent();
                        errorMsg = error_2.message || String(error_2);
                        console.error("Error deleting ".concat(item.type, " ").concat(item.id, ":"), errorMsg);
                        results.push({ type: item.type, id: item.id, success: false, error: errorMsg });
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 2];
                    case 10: return [2 /*return*/, results];
                }
            });
        });
    };
    AutomatedTestService.prototype.runTests = function (courseId_1) {
        return __awaiter(this, arguments, void 0, function (courseId, deleteExisting) {
            var results, _a, token, baseUrl, existingItems, deleteResults, failed, _i, _b, _c, type, config, createData, createUrl, createdItem, createdId, createResponse, errorText, createError_1, _d, _e, param, updateValue, updateBody, updateUrl, updateResponse, errorText, updateError_1, typeError_1;
            if (deleteExisting === void 0) { deleteExisting = false; }
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        results = [];
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _f.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        if (!deleteExisting) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.findExistingExampleItems(courseId)];
                    case 2:
                        existingItems = _f.sent();
                        if (!(existingItems.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.deleteExampleItems(courseId, existingItems)];
                    case 3:
                        deleteResults = _f.sent();
                        failed = deleteResults.filter(function (r) { return !r.success; });
                        if (failed.length > 0) {
                            console.warn("Failed to delete ".concat(failed.length, " items:"), failed);
                        }
                        // Wait a moment for deletions to complete
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 4:
                        // Wait a moment for deletions to complete
                        _f.sent();
                        _f.label = 5;
                    case 5:
                        _i = 0, _b = Object.entries(test_registry_config_1.TEST_CONFIG);
                        _f.label = 6;
                    case 6:
                        if (!(_i < _b.length)) return [3 /*break*/, 26];
                        _c = _b[_i], type = _c[0], config = _c[1];
                        _f.label = 7;
                    case 7:
                        _f.trys.push([7, 24, , 25]);
                        createData = this.getCreateDataForType(type);
                        createUrl = "".concat(baseUrl).concat(config.createPath(courseId));
                        createdItem = void 0;
                        createdId = void 0;
                        _f.label = 8;
                    case 8:
                        _f.trys.push([8, 13, , 14]);
                        return [4 /*yield*/, fetch(createUrl, {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(createData),
                            })];
                    case 9:
                        createResponse = _f.sent();
                        if (!!createResponse.ok) return [3 /*break*/, 11];
                        return [4 /*yield*/, createResponse.text()];
                    case 10:
                        errorText = _f.sent();
                        results.push({
                            endpoint: "".concat(type, " (create)"),
                            parameter: 'create',
                            result: 'failed',
                            errorMessage: "".concat(createResponse.status, " ").concat(createResponse.statusText, ": ").concat(errorText),
                        });
                        return [3 /*break*/, 25]; // Skip this type if creation failed
                    case 11: return [4 /*yield*/, createResponse.json()];
                    case 12:
                        createdItem = _f.sent();
                        createdId = type === 'pages' ? createdItem.url : createdItem.id;
                        results.push({
                            endpoint: "".concat(type, " (create)"),
                            parameter: 'create',
                            result: 'success',
                        });
                        return [3 /*break*/, 14];
                    case 13:
                        createError_1 = _f.sent();
                        results.push({
                            endpoint: "".concat(type, " (create)"),
                            parameter: 'create',
                            result: 'failed',
                            errorMessage: createError_1.message || String(createError_1),
                        });
                        return [3 /*break*/, 25]; // Skip this type if creation failed
                    case 14:
                        _d = 0, _e = config.params;
                        _f.label = 15;
                    case 15:
                        if (!(_d < _e.length)) return [3 /*break*/, 23];
                        param = _e[_d];
                        _f.label = 16;
                    case 16:
                        _f.trys.push([16, 21, , 22]);
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
                    case 17:
                        updateResponse = _f.sent();
                        if (!!updateResponse.ok) return [3 /*break*/, 19];
                        return [4 /*yield*/, updateResponse.text()];
                    case 18:
                        errorText = _f.sent();
                        results.push({
                            endpoint: type,
                            parameter: param,
                            result: 'failed',
                            errorMessage: "".concat(updateResponse.status, " ").concat(updateResponse.statusText, ": ").concat(errorText),
                        });
                        return [3 /*break*/, 20];
                    case 19:
                        results.push({
                            endpoint: type,
                            parameter: param,
                            result: 'success',
                        });
                        _f.label = 20;
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        updateError_1 = _f.sent();
                        results.push({
                            endpoint: type,
                            parameter: param,
                            result: 'failed',
                            errorMessage: updateError_1.message || String(updateError_1),
                        });
                        return [3 /*break*/, 22];
                    case 22:
                        _d++;
                        return [3 /*break*/, 15];
                    case 23: return [3 /*break*/, 25];
                    case 24:
                        typeError_1 = _f.sent();
                        results.push({
                            endpoint: type,
                            parameter: 'all',
                            result: 'failed',
                            errorMessage: typeError_1.message || String(typeError_1),
                        });
                        return [3 /*break*/, 25];
                    case 25:
                        _i++;
                        return [3 /*break*/, 6];
                    case 26: return [2 /*return*/, results];
                }
            });
        });
    };
    AutomatedTestService.prototype.getExpectedNameForType = function (type) {
        return "Example ".concat(type.charAt(0).toUpperCase() + type.slice(1));
    };
    AutomatedTestService.prototype.getCreateDataForType = function (type) {
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
                return { title: baseName, message: 'Test announcement', is_announcement: true };
            case 'modules':
                return { module: { name: baseName } };
            default:
                return {};
        }
    };
    AutomatedTestService.prototype.getUpdateBodyForType = function (type, updateData) {
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
    AutomatedTestService.prototype.getUpdateDataForParameter = function (param, type) {
        // Return test values based on parameter type (without wrapping)
        var updateValue = {};
        switch (param) {
            case 'name':
            case 'title':
                // Preserve "Example" prefix so items can be found for deletion
                var expectedName = this.getExpectedNameForType(type);
                updateValue[param] = "".concat(expectedName, " - Updated ").concat(param);
                break;
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
            case 'editing_roles':
                updateValue[param] = 'teachers';
                break;
            default:
                updateValue[param] = 'test_value';
        }
        return updateValue;
    };
    AutomatedTestService = __decorate([
        (0, common_1.Injectable)()
    ], AutomatedTestService);
    return AutomatedTestService;
}());
exports.AutomatedTestService = AutomatedTestService;

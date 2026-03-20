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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.CanvasService = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var core_1 = require("@nestjs/core");
var CanvasService = /** @class */ (function () {
    function CanvasService(req, config) {
        this.req = req;
        this.config = config;
    }
    CanvasService_1 = CanvasService;
    CanvasService.prototype.getCourses = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, termMap, allCourses, url, response, chunk, linkHeader, processedCourses, grouped;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, this.getTermMap()];
                    case 2:
                        termMap = _b.sent();
                        allCourses = [];
                        url = "".concat(baseUrl, "/users/self/courses?per_page=100&state=all");
                        _b.label = 3;
                    case 3:
                        if (!url) return [3 /*break*/, 6];
                        return [4 /*yield*/, fetch(url, {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok)
                            throw new Error("Canvas API Error: ".concat(response.statusText));
                        return [4 /*yield*/, response.json()];
                    case 5:
                        chunk = (_b.sent());
                        if (Array.isArray(chunk)) {
                            allCourses.push.apply(allCourses, chunk);
                        }
                        linkHeader = response.headers.get('link');
                        url = this.getNextUrl(linkHeader);
                        return [3 /*break*/, 3];
                    case 6:
                        processedCourses = allCourses.map(function (course) {
                            var sisId = (course.sis_course_id || '').trim();
                            var termLabel = _this.buildTermLabel(course, termMap, sisId);
                            return {
                                id: course.id,
                                name: course.name || course.course_code || "ID: ".concat(course.id),
                                course_code: course.course_code || 'No Code',
                                term_label: termLabel,
                                end_date: course.end_at || null,
                                created_at: course.created_at || null
                            };
                        });
                        grouped = processedCourses.reduce(function (acc, course) {
                            var term = course.term_label;
                            if (!acc[term]) {
                                var termData = Object.values(termMap).find(function (t) { return t.name === term; });
                                var sortDate = (termData === null || termData === void 0 ? void 0 : termData.end) || course.end_date || course.created_at || '1970-01-01T00:00:00Z';
                                acc[term] = {
                                    term: term,
                                    sortDate: sortDate,
                                    courses: []
                                };
                            }
                            acc[term].courses.push(course);
                            return acc;
                        }, {});
                        return [2 /*return*/, Object.values(grouped)
                                .sort(function (a, b) {
                                if (a.term === 'No Term Assigned')
                                    return 1;
                                if (b.term === 'No Term Assigned')
                                    return -1;
                                return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime();
                            })
                                .map(function (group) { return ({
                                term: group.term,
                                courses: group.courses.sort(function (a, b) { return a.name.localeCompare(b.name); })
                            }); })];
                }
            });
        });
    };
    CanvasService.prototype.buildTermLabel = function (course, termMap, sisId) {
        var match = sisId.match(/(\d{5,6})\s*$/);
        if (match) {
            return this.decodeNumericTerm(match[1]);
        }
        if (course.enrollment_term_id && termMap[course.enrollment_term_id]) {
            return termMap[course.enrollment_term_id].name;
        }
        return 'No Term Assigned';
    };
    CanvasService.prototype.decodeNumericTerm = function (numericTerm) {
        var year = parseInt(numericTerm.substring(0, 4), 10);
        var termIndex = parseInt(numericTerm.substring(4), 10);
        var universalMap = {
            1: "Fall", 2: "Spring", 3: "Summer I", 4: "Summer II", 5: "Summer Special",
            10: "Fall", 20: "Spring", 31: "Summer I", 32: "Summer II", 40: "Summer Special"
        };
        var termName = universalMap[termIndex] || "Term ".concat(termIndex);
        var realYear = (termIndex === 1 || termIndex === 10) ? year - 1 : year;
        return "".concat(termName, " ").concat(realYear);
    };
    CanvasService.prototype.getTermMap = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, data, terms, termMap_1, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/accounts/self/terms"), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        response = _c.sent();
                        if (!response.ok)
                            return [2 /*return*/, {}];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _c.sent();
                        terms = data.enrollment_terms || [];
                        termMap_1 = {};
                        terms.forEach(function (t) {
                            if (t.id != null) {
                                termMap_1[t.id] = {
                                    name: t.name || '',
                                    end: t.end_at || '1970-01-01T00:00:00Z'
                                };
                            }
                        });
                        return [2 /*return*/, termMap_1];
                    case 4:
                        _b = _c.sent();
                        return [2 /*return*/, {}];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.getNextUrl = function (linkHeader) {
        var _a;
        if (!linkHeader)
            return null;
        var match = (_a = linkHeader.split(',').find(function (l) { return l.includes('rel="next"'); })) === null || _a === void 0 ? void 0 : _a.match(/<([^>]+)>/);
        return match ? match[1] : null;
    };
    CanvasService.prototype.getAuthHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token, baseUrl;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                token = (_b = (_a = this.req) === null || _a === void 0 ? void 0 : _a.session) === null || _b === void 0 ? void 0 : _b.canvasToken;
                baseUrl = (_d = (_c = this.req) === null || _c === void 0 ? void 0 : _c.session) === null || _d === void 0 ? void 0 : _d.canvasUrl;
                if (!token || !baseUrl) {
                    throw new Error('Unauthorized: No Canvas token. Launch via LTI and complete Canvas OAuth.');
                }
                return [2 /*return*/, { token: token, baseUrl: baseUrl }];
            });
        });
    };
    CanvasService.prototype.getCourseDetails = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "?include[]=syllabus_body&include[]=total_scores"), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Canvas API Error: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getCourseStudents = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1, _a, token, baseUrl, allStudents, url, response, chunk, linkHeader;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.ensureAccommodationColumns(courseId)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.warn("[Service] Failed to ensure accommodation columns before fetching students:", error_1.message);
                        return [3 /*break*/, 3];
                    case 3: return [4 /*yield*/, this.getAuthHeaders()];
                    case 4:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        allStudents = [];
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/enrollments?per_page=100&type[]=StudentEnrollment&include[]=user");
                        _b.label = 5;
                    case 5:
                        if (!url) return [3 /*break*/, 8];
                        return [4 /*yield*/, fetch(url, {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 6:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Canvas API Error: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 7:
                        chunk = _b.sent();
                        if (Array.isArray(chunk)) {
                            allStudents.push.apply(allStudents, chunk);
                        }
                        linkHeader = response.headers.get('link');
                        url = this.getNextUrl(linkHeader);
                        return [3 /*break*/, 5];
                    case 8: 
                    // Extract and format student data
                    return [2 /*return*/, allStudents.map(function (enrollment) {
                            var _a, _b, _c, _d, _e, _f;
                            return ({
                                id: ((_a = enrollment.user) === null || _a === void 0 ? void 0 : _a.id) || enrollment.user_id,
                                name: ((_b = enrollment.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = enrollment.user) === null || _c === void 0 ? void 0 : _c.display_name) || 'Unknown',
                                email: ((_d = enrollment.user) === null || _d === void 0 ? void 0 : _d.email) || ((_e = enrollment.user) === null || _e === void 0 ? void 0 : _e.login_id) || null,
                                sis_user_id: ((_f = enrollment.user) === null || _f === void 0 ? void 0 : _f.sis_user_id) || null,
                                enrollment_id: enrollment.id,
                                enrollment_type: enrollment.type,
                                enrollment_state: enrollment.enrollment_state,
                                created_at: enrollment.created_at,
                                updated_at: enrollment.updated_at,
                            });
                        })];
                }
            });
        });
    };
    CanvasService.prototype.fetchPaginatedData = function (url, token) {
        return __awaiter(this, void 0, void 0, function () {
            var allData, currentUrl, pageCount, response, errorText, responseText, chunk, linkHeader, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        allData = [];
                        currentUrl = url;
                        pageCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!currentUrl) return [3 /*break*/, 6];
                        pageCount++;
                        console.log("[Service] Fetching page ".concat(pageCount, " from: ").concat(currentUrl));
                        return [4 /*yield*/, fetch(currentUrl, {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        response = _a.sent();
                        console.log("[Service] Response status: ".concat(response.status, " ").concat(response.statusText));
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _a.sent();
                        console.error("[Service] Canvas API error: ".concat(response.status, " ").concat(response.statusText));
                        console.error("[Service] Error response: ".concat(errorText));
                        throw new Error("Canvas API Error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.text()];
                    case 5:
                        responseText = _a.sent();
                        console.log("[Service] Response body length: ".concat(responseText.length, " characters"));
                        console.log("[Service] Raw response body: ".concat(responseText.substring(0, 500)).concat(responseText.length > 500 ? '...' : ''));
                        chunk = void 0;
                        try {
                            chunk = JSON.parse(responseText);
                        }
                        catch (parseError) {
                            console.error("[Service] Failed to parse JSON: ".concat(parseError.message));
                            console.error("[Service] Response text: ".concat(responseText));
                            throw new Error("Invalid JSON response: ".concat(parseError.message));
                        }
                        console.log("[Service] Parsed chunk type: ".concat(Array.isArray(chunk) ? 'array' : typeof chunk, ", length: ").concat(Array.isArray(chunk) ? chunk.length : 'N/A'));
                        if (Array.isArray(chunk)) {
                            allData.push.apply(allData, chunk);
                            console.log("[Service] Added ".concat(chunk.length, " items, total: ").concat(allData.length));
                        }
                        else if (chunk) {
                            // Some endpoints return objects instead of arrays
                            allData.push(chunk);
                            console.log("[Service] Added 1 object, total: ".concat(allData.length));
                        }
                        else {
                            console.log("[Service] Chunk is null/undefined, skipping");
                        }
                        linkHeader = response.headers.get('link');
                        console.log("[Service] Link header: ".concat(linkHeader || 'none'));
                        currentUrl = this.getNextUrl(linkHeader);
                        if (currentUrl) {
                            console.log("[Service] More pages available, next URL: ".concat(currentUrl));
                        }
                        else {
                            console.log("[Service] No more pages, total items: ".concat(allData.length));
                        }
                        return [3 /*break*/, 1];
                    case 6:
                        console.log("[Service] fetchPaginatedData complete, returning ".concat(allData.length, " items"));
                        return [2 /*return*/, allData];
                    case 7:
                        error_2 = _a.sent();
                        console.error("[Service] Error in fetchPaginatedData:", error_2);
                        console.error("[Service] Error message:", error_2.message);
                        console.error("[Service] Error stack:", error_2.stack);
                        throw error_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.getCourseQuizzes = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, result, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        console.log("[Service] Getting quizzes for course ".concat(courseId));
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes?per_page=100");
                        console.log("[Service] Fetching from: ".concat(url));
                        console.log("[Service] Base URL: ".concat(baseUrl));
                        console.log("[Service] Course ID: ".concat(courseId));
                        console.log("[Service] Full URL: ".concat(url));
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2:
                        result = _b.sent();
                        console.log("[Service] Retrieved ".concat(result.length, " quizzes"));
                        return [2 /*return*/, result];
                    case 3:
                        error_3 = _b.sent();
                        console.error("[Service] Error in getCourseQuizzes for course ".concat(courseId, ":"), error_3);
                        console.error("[Service] Error message:", error_3.message);
                        console.error("[Service] Error stack:", error_3.stack);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.getCourseAssignments = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100&include[]=submission");
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getCourseAssignmentGroups = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, groups, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups?per_page=100");
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2:
                        groups = _b.sent();
                        console.log("[Service] Retrieved ".concat(groups.length, " assignment groups for course ").concat(courseId));
                        return [2 /*return*/, groups];
                    case 3:
                        error_4 = _b.sent();
                        console.error("[Service] Error in getCourseAssignmentGroups for course ".concat(courseId, ":"), error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.createAssignmentGroup = function (courseId, name, groupWeight) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, body, response, errorText, result, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups");
                        body = { name: name };
                        if (groupWeight !== undefined) {
                            body.group_weight = groupWeight;
                        }
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(body),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        result = _b.sent();
                        console.log("[Service] Created assignment group \"".concat(name, "\" with ID: ").concat(result.id));
                        return [2 /*return*/, result];
                    case 6:
                        error_5 = _b.sent();
                        console.error("[Service] Error creating assignment group:", error_5);
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.updateAssignmentGroup = function (courseId, groupId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, body, response, errorText, result, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups/").concat(groupId);
                        body = {};
                        if (updates.name !== undefined) {
                            body.name = updates.name;
                        }
                        if (updates.group_weight !== undefined) {
                            body.group_weight = updates.group_weight;
                        }
                        return [4 /*yield*/, fetch(url, {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(body),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        result = _b.sent();
                        console.log("[Service] Updated assignment group ".concat(groupId));
                        return [2 /*return*/, result];
                    case 6:
                        error_6 = _b.sent();
                        console.error("[Service] Error updating assignment group:", error_6);
                        throw error_6;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.deleteAssignmentGroup = function (courseId, groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups/").concat(groupId);
                        return [4 /*yield*/, fetch(url, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4:
                        console.log("[Service] Deleted assignment group ".concat(groupId));
                        return [2 /*return*/, { success: true }];
                    case 5:
                        error_7 = _b.sent();
                        console.error("[Service] Error deleting assignment group:", error_7);
                        throw error_7;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.getCourseDiscussions = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?per_page=100");
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getCoursePages = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, pages, pagesWithBody;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/pages?per_page=100");
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2:
                        pages = _b.sent();
                        return [4 /*yield*/, Promise.all(pages.map(function (page) { return __awaiter(_this, void 0, void 0, function () {
                                var pageUrl, pageResponse, pageDetails, error_8;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!page.url) return [3 /*break*/, 6];
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 5, , 6]);
                                            pageUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(page.url));
                                            return [4 /*yield*/, fetch(pageUrl, {
                                                    headers: { Authorization: "Bearer ".concat(token) },
                                                })];
                                        case 2:
                                            pageResponse = _a.sent();
                                            if (!pageResponse.ok) return [3 /*break*/, 4];
                                            return [4 /*yield*/, pageResponse.json()];
                                        case 3:
                                            pageDetails = _a.sent();
                                            return [2 /*return*/, __assign(__assign({}, page), { body: pageDetails.body || null, html_url: pageDetails.html_url || page.html_url || null })];
                                        case 4: return [3 /*break*/, 6];
                                        case 5:
                                            error_8 = _a.sent();
                                            console.warn("[Service] Failed to fetch body for page ".concat(page.url, ":"), error_8);
                                            return [3 /*break*/, 6];
                                        case 6: return [2 /*return*/, page];
                                    }
                                });
                            }); }))];
                    case 3:
                        pagesWithBody = _b.sent();
                        return [2 /*return*/, pagesWithBody];
                }
            });
        });
    };
    CanvasService.prototype.getCourseAnnouncements = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?only_announcements=true&per_page=100");
                        console.log("[Service] Fetching announcements for course ".concat(courseId, " from: ").concat(url));
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getCourseModules = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/modules?per_page=100&include[]=items");
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getCourseFiles = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, files, foldersUrl, folders, folderMap, filesWithUsage, foldersWithCounts;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/files?per_page=100");
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2:
                        files = _b.sent();
                        foldersUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/folders?per_page=100");
                        return [4 /*yield*/, this.fetchPaginatedData(foldersUrl, token)];
                    case 3:
                        folders = _b.sent();
                        folderMap = new Map();
                        folders.forEach(function (folder) {
                            if (folder.id && folder.full_name) {
                                folderMap.set(folder.id, folder.full_name);
                            }
                        });
                        return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                                var usage, folderPath;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.getFileUsage(courseId, file.id)];
                                        case 1:
                                            usage = _a.sent();
                                            folderPath = file.folder_id ? (folderMap.get(file.folder_id) || 'Unknown') : 'Root';
                                            return [2 /*return*/, __assign(__assign({}, file), { usage: usage, folder_path: folderPath, is_folder: false })];
                                    }
                                });
                            }); }))];
                    case 4:
                        filesWithUsage = _b.sent();
                        return [4 /*yield*/, Promise.all(folders.map(function (folder) { return __awaiter(_this, void 0, void 0, function () {
                                var fileCount, folderCount, subfoldersUrl, subfolders, error_9, itemCount, folderPath;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            fileCount = folder.files_count || 0;
                                            folderCount = 0;
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            subfoldersUrl = "".concat(baseUrl, "/folders/").concat(folder.id, "/folders?per_page=100");
                                            return [4 /*yield*/, this.fetchPaginatedData(subfoldersUrl, token)];
                                        case 2:
                                            subfolders = _a.sent();
                                            folderCount = subfolders.length;
                                            return [3 /*break*/, 4];
                                        case 3:
                                            error_9 = _a.sent();
                                            console.error("[Service] Error fetching subfolders for folder ".concat(folder.id, ":"), error_9);
                                            return [3 /*break*/, 4];
                                        case 4:
                                            itemCount = fileCount + folderCount;
                                            folderPath = folder.parent_folder_id ? (folderMap.get(folder.parent_folder_id) || 'Unknown') : 'Root';
                                            return [2 /*return*/, {
                                                    id: folder.id,
                                                    display_name: folder.name,
                                                    filename: folder.name,
                                                    folder: true,
                                                    is_folder: true,
                                                    content_type: 'folder',
                                                    size: null,
                                                    modified_at: folder.updated_at || folder.created_at,
                                                    folder_path: folderPath,
                                                    folder_id: folder.parent_folder_id,
                                                    usage: [],
                                                    item_count: itemCount,
                                                    file_count: fileCount,
                                                    folder_count: folderCount
                                                }];
                                    }
                                });
                            }); }))];
                    case 5:
                        foldersWithCounts = _b.sent();
                        return [2 /*return*/, __spreadArray(__spreadArray([], filesWithUsage, true), foldersWithCounts, true)];
                }
            });
        });
    };
    CanvasService.prototype.getFileUsage = function (courseId, fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, usage, fileUrl, fileResponse, fileData, fileUrlPattern_1, fileIdPattern_1, _b, assignments, quizzes, pages, discussions, error_10;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        usage = [];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 6, , 7]);
                        fileUrl = "".concat(baseUrl, "/files/").concat(fileId);
                        return [4 /*yield*/, fetch(fileUrl, {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 3:
                        fileResponse = _c.sent();
                        if (!fileResponse.ok)
                            return [2 /*return*/, usage];
                        return [4 /*yield*/, fileResponse.json()];
                    case 4:
                        fileData = _c.sent();
                        fileUrlPattern_1 = fileData.url ? new RegExp(fileData.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null;
                        fileIdPattern_1 = new RegExp("/files/".concat(fileId), 'gi');
                        return [4 /*yield*/, Promise.all([
                                this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100"), token).catch(function () { return []; }),
                                this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes?per_page=100"), token).catch(function () { return []; }),
                                this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/pages?per_page=100"), token).catch(function () { return []; }),
                                this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/discussions?per_page=100"), token).catch(function () { return []; }),
                            ])];
                    case 5:
                        _b = _c.sent(), assignments = _b[0], quizzes = _b[1], pages = _b[2], discussions = _b[3];
                        assignments.forEach(function (assignment) {
                            var content = (assignment.description || assignment.instructions || '').toLowerCase();
                            var matchesUrl = fileUrlPattern_1 ? fileUrlPattern_1.test(content) : false;
                            if (matchesUrl || fileIdPattern_1.test(content)) {
                                usage.push({ type: 'Assignment', id: assignment.id, title: assignment.name || assignment.title || 'Untitled' });
                            }
                        });
                        quizzes.forEach(function (quiz) {
                            var content = (quiz.description || '').toLowerCase();
                            var matchesUrl = fileUrlPattern_1 ? fileUrlPattern_1.test(content) : false;
                            if (matchesUrl || fileIdPattern_1.test(content)) {
                                usage.push({ type: 'Quiz', id: quiz.id, title: quiz.title || 'Untitled' });
                            }
                        });
                        pages.forEach(function (page) {
                            var content = (page.body || '').toLowerCase();
                            var matchesUrl = fileUrlPattern_1 ? fileUrlPattern_1.test(content) : false;
                            if (matchesUrl || fileIdPattern_1.test(content)) {
                                usage.push({ type: 'Page', id: page.page_id, title: page.title || page.url || 'Untitled' });
                            }
                        });
                        discussions.forEach(function (discussion) {
                            var content = (discussion.message || '').toLowerCase();
                            var matchesUrl = fileUrlPattern_1 ? fileUrlPattern_1.test(content) : false;
                            if (matchesUrl || fileIdPattern_1.test(content)) {
                                usage.push({ type: 'Discussion', id: discussion.id, title: discussion.title || 'Untitled' });
                            }
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        error_10 = _c.sent();
                        console.error("[Service] Error checking file usage for file ".concat(fileId, ":"), error_10);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, usage];
                }
            });
        });
    };
    CanvasService.prototype.bulkDeleteFiles = function (courseId_1, fileIds_1) {
        return __awaiter(this, arguments, void 0, function (courseId, fileIds, isFolders) {
            var _a, token, baseUrl, results, i, fileId, isFolder, url, response, errorText, error_11;
            if (isFolders === void 0) { isFolders = []; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        i = 0;
                        _b.label = 2;
                    case 2:
                        if (!(i < fileIds.length)) return [3 /*break*/, 9];
                        fileId = fileIds[i];
                        isFolder = isFolders[i] || false;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 7, , 8]);
                        url = isFolder ? "".concat(baseUrl, "/folders/").concat(fileId) : "".concat(baseUrl, "/files/").concat(fileId);
                        return [4 /*yield*/, fetch(url, {
                                method: 'DELETE',
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 4:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, response.text()];
                    case 5:
                        errorText = _b.sent();
                        throw new Error("Failed to delete ".concat(isFolder ? 'folder' : 'file', " ").concat(fileId, ": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 6:
                        results.push({ fileId: fileId, success: true });
                        return [3 /*break*/, 8];
                    case 7:
                        error_11 = _b.sent();
                        console.error("[Service] Error deleting ".concat(isFolder ? 'folder' : 'file', " ").concat(fileId, ":"), error_11);
                        results.push({ fileId: fileId, success: false, error: error_11.message });
                        return [3 /*break*/, 8];
                    case 8:
                        i++;
                        return [3 /*break*/, 2];
                    case 9: return [2 /*return*/, results];
                }
            });
        });
    };
    CanvasService.prototype.renameFile = function (courseId, fileId, newName) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText, result, error_12;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/files/").concat(fileId);
                        return [4 /*yield*/, fetch(url, {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ name: newName }),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        result = _b.sent();
                        console.log("[Service] Renamed file ".concat(fileId, " to ").concat(newName));
                        return [2 /*return*/, result];
                    case 6:
                        error_12 = _b.sent();
                        console.error("[Service] Error renaming file ".concat(fileId, ":"), error_12);
                        throw error_12;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.renameFolder = function (folderId, newName) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText, result, error_13;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/folders/").concat(folderId);
                        return [4 /*yield*/, fetch(url, {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ name: newName }),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        result = _b.sent();
                        console.log("[Service] Renamed folder ".concat(folderId, " to ").concat(newName));
                        return [2 /*return*/, result];
                    case 6:
                        error_13 = _b.sent();
                        console.error("[Service] Error renaming folder ".concat(folderId, ":"), error_13);
                        throw error_13;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.getCourseAccommodations = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, assignments, allOverrides, _loop_1, this_1, _i, assignments_1, assignment, quizzes, _loop_2, this_2, _b, quizzes_1, quiz;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, this.getCourseAssignments(courseId)];
                    case 2:
                        assignments = _c.sent();
                        allOverrides = [];
                        _loop_1 = function (assignment) {
                            var url, overrides, error_14;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _d.trys.push([0, 2, , 3]);
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignment.id, "/overrides?per_page=100");
                                        return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                    case 1:
                                        overrides = _d.sent();
                                        allOverrides.push.apply(allOverrides, overrides.map(function (override) { return (__assign(__assign({}, override), { assignment_id: assignment.id, assignment_name: assignment.name })); }));
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_14 = _d.sent();
                                        // Some assignments may not have overrides, continue
                                        console.warn("Could not fetch overrides for assignment ".concat(assignment.id));
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, assignments_1 = assignments;
                        _c.label = 3;
                    case 3:
                        if (!(_i < assignments_1.length)) return [3 /*break*/, 6];
                        assignment = assignments_1[_i];
                        return [5 /*yield**/, _loop_1(assignment)];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [4 /*yield*/, this.getCourseQuizzes(courseId)];
                    case 7:
                        quizzes = _c.sent();
                        _loop_2 = function (quiz) {
                            var url, extensions, error_15;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        _e.trys.push([0, 2, , 3]);
                                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quiz.id, "/extensions?per_page=100");
                                        return [4 /*yield*/, this_2.fetchPaginatedData(url, token)];
                                    case 1:
                                        extensions = _e.sent();
                                        allOverrides.push.apply(allOverrides, extensions.map(function (ext) { return (__assign(__assign({}, ext), { quiz_id: quiz.id, quiz_name: quiz.title, type: 'quiz_extension' })); }));
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_15 = _e.sent();
                                        // Some quizzes may not have extensions, continue
                                        console.warn("Could not fetch extensions for quiz ".concat(quiz.id));
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _b = 0, quizzes_1 = quizzes;
                        _c.label = 8;
                    case 8:
                        if (!(_b < quizzes_1.length)) return [3 /*break*/, 11];
                        quiz = quizzes_1[_b];
                        return [5 /*yield**/, _loop_2(quiz)];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10:
                        _b++;
                        return [3 /*break*/, 8];
                    case 11: return [2 /*return*/, allOverrides];
                }
            });
        });
    };
    // Individual GET methods (for fetching full item data)
    CanvasService.prototype.getAssignment = function (courseId, assignmentId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to get assignment: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getQuiz = function (courseId, quizId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to get quiz: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getDiscussion = function (courseId, discussionId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to get discussion: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getPage = function (courseId, pageUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, lastError, attempt, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        lastError = null;
                        attempt = 0;
                        _b.label = 2;
                    case 2:
                        if (!(attempt < 3)) return [3 /*break*/, 10];
                        if (!(attempt > 0)) return [3 /*break*/, 4];
                        // Wait 500ms before retry
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 3:
                        // Wait 500ms before retry
                        _b.sent();
                        _b.label = 4;
                    case 4: return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl)), {
                            headers: { Authorization: "Bearer ".concat(token) },
                        })];
                    case 5:
                        response = _b.sent();
                        if (!response.ok) return [3 /*break*/, 7];
                        return [4 /*yield*/, response.json()];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7:
                        if (!(response.status !== 404 || attempt === 2)) return [3 /*break*/, 9];
                        return [4 /*yield*/, response.text()];
                    case 8:
                        errorText = _b.sent();
                        lastError = new Error("Failed to get page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        if (response.status !== 404) {
                            throw lastError;
                        }
                        _b.label = 9;
                    case 9:
                        attempt++;
                        return [3 /*break*/, 2];
                    case 10: 
                    // If we get here, all retries failed with 404
                    throw lastError || new Error("Failed to get page: Resource not found after retries");
                }
            });
        });
    };
    CanvasService.prototype.getAnnouncement = function (courseId, announcementId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Announcements are discussions, so use the same endpoint
                return [2 /*return*/, this.getDiscussion(courseId, announcementId)];
            });
        });
    };
    // Individual update methods (for inline editing)
    CanvasService.prototype.updateAssignment = function (courseId, assignmentId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, cleanedUpdates_1, requestBody, response, responseText, errorMessage, result, error_16;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        console.log("[Service] updateAssignment called for assignment ".concat(assignmentId, " in course ").concat(courseId));
                        console.log("[Service] Raw updates:", JSON.stringify(updates, null, 2));
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        cleanedUpdates_1 = {};
                        Object.keys(updates).forEach(function (key) {
                            var value = updates[key];
                            // Handle dates first - allow null to delete dates (Canvas API accepts null to clear dates)
                            if (key.includes('_at') || key.includes('date')) {
                                if (value === null) {
                                    // null is a valid value to send to Canvas to delete/clear a date field
                                    cleanedUpdates_1[key] = null;
                                }
                                else if (value !== undefined && value !== '') {
                                    try {
                                        var date = new Date(value);
                                        if (!isNaN(date.getTime())) {
                                            cleanedUpdates_1[key] = date.toISOString();
                                        }
                                        else {
                                            console.warn("[Service] Invalid date for ".concat(key, ": ").concat(value));
                                        }
                                    }
                                    catch (e) {
                                        console.warn("[Service] Error parsing date for ".concat(key, ":"), value, e);
                                    }
                                }
                                return; // Date fields are handled, skip to next field
                            }
                            // Skip null, undefined, and empty strings for non-date fields
                            if (value === null || value === undefined || value === '') {
                                return;
                            }
                            // Handle boolean values
                            if (typeof value === 'boolean') {
                                cleanedUpdates_1[key] = value;
                            }
                            // Handle numbers
                            else if (typeof value === 'number') {
                                cleanedUpdates_1[key] = value;
                            }
                            // Handle strings
                            else if (typeof value === 'string') {
                                cleanedUpdates_1[key] = value;
                            }
                            else {
                                cleanedUpdates_1[key] = value;
                            }
                        });
                        // Check if we have any updates to send
                        if (Object.keys(cleanedUpdates_1).length === 0) {
                            throw new Error('No valid updates to send to Canvas API');
                        }
                        console.log("[Service] Updating assignment ".concat(assignmentId, " in course ").concat(courseId));
                        console.log("[Service] Cleaned updates:", JSON.stringify(cleanedUpdates_1, null, 2));
                        console.log("[Service] Canvas API URL: ".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId));
                        requestBody = JSON.stringify({ assignment: cleanedUpdates_1 });
                        console.log("[Service] Request body (wrapped):", requestBody);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: requestBody,
                            })];
                    case 2:
                        response = _b.sent();
                        console.log("[Service] Response status: ".concat(response.status, " ").concat(response.statusText));
                        return [4 /*yield*/, response.text()];
                    case 3:
                        responseText = _b.sent();
                        console.log("[Service] Raw response body:", responseText);
                        console.log("[Service] Response body length: ".concat(responseText.length, " characters"));
                        if (!response.ok) {
                            console.error("[Service] Canvas API error: ".concat(response.status, " ").concat(response.statusText));
                            console.error("[Service] Error response body:", responseText);
                            // Provide more helpful error messages for common issues
                            if (response.status === 403) {
                                errorMessage = "Canvas API returned 403 Forbidden. Common causes:\n";
                                errorMessage += "1. The course has ended - Canvas restricts write operations on ended courses\n";
                                errorMessage += "2. The API token doesn't have write permissions\n";
                                errorMessage += "3. The user associated with the token doesn't have permission to modify assignments in this course\n";
                                errorMessage += "4. The token may need to be regenerated with proper scopes\n\n";
                                errorMessage += "Canvas API response: ".concat(responseText);
                                throw new Error(errorMessage);
                            }
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(responseText));
                        }
                        result = void 0;
                        try {
                            result = JSON.parse(responseText);
                            console.log("[Service] Parsed JSON response successfully");
                        }
                        catch (parseError) {
                            console.error("[Service] Failed to parse JSON response:", parseError);
                            console.error("[Service] Response text that failed to parse:", responseText);
                            throw new Error("Canvas API returned invalid JSON: ".concat(responseText));
                        }
                        console.log("[Service] Assignment ".concat(assignmentId, " updated successfully"));
                        console.log("[Service] Canvas API response (formatted):", JSON.stringify(result, null, 2));
                        return [2 /*return*/, result];
                    case 4:
                        error_16 = _b.sent();
                        console.error("[Service] Error in updateAssignment for assignment ".concat(assignmentId, ":"), error_16);
                        console.error("[Service] Error message:", error_16.message);
                        console.error("[Service] Error stack:", error_16.stack);
                        // Ensure we throw a proper error that NestJS can handle
                        if (error_16 instanceof Error) {
                            throw error_16;
                        }
                        else {
                            throw new Error("Failed to update assignment ".concat(assignmentId, ": ").concat(String(error_16)));
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.updateQuiz = function (courseId, quizId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, courseInfo, endDate, now, errorMessage, courseCheckError_1, cleanedUpdates_2, requestBody, response, responseText, errorMessage, result_1, assignmentResult, assignmentError_1, error_17;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 14, , 15]);
                        console.log("[Service] updateQuiz called for quiz ".concat(quizId, " in course ").concat(courseId));
                        console.log("[Service] Raw updates:", JSON.stringify(updates, null, 2));
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.getCourseDetails(courseId)];
                    case 3:
                        courseInfo = _b.sent();
                        endDate = courseInfo.end_at ? new Date(courseInfo.end_at) : null;
                        now = new Date();
                        if (endDate && endDate < now) {
                            errorMessage = "Cannot update quiz: Course has ended (ended on ".concat(endDate.toLocaleDateString(), "). ") +
                                "Canvas restricts write operations on ended courses to preserve historical data.";
                            console.warn("[Service] ".concat(errorMessage));
                            throw new Error(errorMessage);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        courseCheckError_1 = _b.sent();
                        // If the error is about course ending, re-throw it
                        if (courseCheckError_1.message.includes('Course has ended')) {
                            throw courseCheckError_1;
                        }
                        // Otherwise, log but continue (course check is not critical)
                        console.warn("[Service] Could not verify course end date:", courseCheckError_1.message);
                        return [3 /*break*/, 5];
                    case 5:
                        console.log("[Service] Got auth headers, baseUrl: ".concat(baseUrl));
                        cleanedUpdates_2 = {};
                        Object.keys(updates).forEach(function (key) {
                            var value = updates[key];
                            // Skip null, undefined, and empty strings
                            if (value === null || value === undefined || value === '') {
                                return;
                            }
                            // Handle boolean values - Canvas expects true/false, not strings
                            if (typeof value === 'boolean') {
                                cleanedUpdates_2[key] = value;
                            }
                            // Handle dates - ensure they're in ISO format
                            else if (key.includes('_at') || key.includes('date')) {
                                if (value) {
                                    try {
                                        var date = new Date(value);
                                        if (!isNaN(date.getTime())) {
                                            cleanedUpdates_2[key] = date.toISOString();
                                        }
                                        else {
                                            console.warn("[Service] Invalid date for ".concat(key, ": ").concat(value));
                                        }
                                    }
                                    catch (e) {
                                        console.warn("[Service] Error parsing date for ".concat(key, ":"), value, e);
                                    }
                                }
                            }
                            // Handle numbers
                            else if (typeof value === 'number') {
                                cleanedUpdates_2[key] = value;
                            }
                            // Handle strings
                            else if (typeof value === 'string') {
                                cleanedUpdates_2[key] = value;
                            }
                            else {
                                cleanedUpdates_2[key] = value;
                            }
                        });
                        // Check if we have any updates to send
                        if (Object.keys(cleanedUpdates_2).length === 0) {
                            throw new Error('No valid updates to send to Canvas API');
                        }
                        console.log("[Service] Updating quiz ".concat(quizId, " in course ").concat(courseId));
                        console.log("[Service] Cleaned updates:", JSON.stringify(cleanedUpdates_2, null, 2));
                        console.log("[Service] Canvas API URL: ".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId));
                        requestBody = JSON.stringify({ quiz: cleanedUpdates_2 });
                        console.log("[Service] Request body (wrapped):", requestBody);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: requestBody,
                            })];
                    case 6:
                        response = _b.sent();
                        console.log("[Service] Response status: ".concat(response.status, " ").concat(response.statusText));
                        console.log("[Service] Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
                        return [4 /*yield*/, response.text()];
                    case 7:
                        responseText = _b.sent();
                        console.log("[Service] Raw response body:", responseText);
                        console.log("[Service] Response body length: ".concat(responseText.length, " characters"));
                        if (!response.ok) {
                            console.error("[Service] Canvas API error: ".concat(response.status, " ").concat(response.statusText));
                            console.error("[Service] Error response body:", responseText);
                            // Provide more helpful error messages for common issues
                            if (response.status === 403) {
                                errorMessage = "Canvas API returned 403 Forbidden. Common causes:\n";
                                errorMessage += "1. The course has ended - Canvas restricts write operations on ended courses to preserve historical data\n";
                                errorMessage += "2. The API token doesn't have write permissions\n";
                                errorMessage += "3. The user associated with the token doesn't have permission to modify quizzes in this course\n";
                                errorMessage += "4. The token may need to be regenerated with proper scopes\n\n";
                                errorMessage += "Canvas API response: ".concat(responseText);
                                throw new Error(errorMessage);
                            }
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(responseText));
                        }
                        try {
                            result_1 = JSON.parse(responseText);
                            console.log("[Service] Parsed JSON response successfully");
                        }
                        catch (parseError) {
                            console.error("[Service] Failed to parse JSON response:", parseError);
                            console.error("[Service] Response text that failed to parse:", responseText);
                            throw new Error("Canvas API returned invalid JSON: ".concat(responseText));
                        }
                        console.log("[Service] Quiz ".concat(quizId, " updated successfully"));
                        console.log("[Service] Canvas API response (formatted):", JSON.stringify(result_1, null, 2));
                        // Log specific fields we care about
                        console.log("[Service] Response quiz ID: ".concat(result_1.id));
                        console.log("[Service] Response quiz title: ".concat(result_1.title));
                        console.log("[Service] Response due_at: ".concat(result_1.due_at || 'null/undefined'));
                        console.log("[Service] Response assignment_id: ".concat(result_1.assignment_id || 'null/undefined'));
                        console.log("[Service] Response lock_at: ".concat(result_1.lock_at || 'null/undefined'));
                        console.log("[Service] Response unlock_at: ".concat(result_1.unlock_at || 'null/undefined'));
                        console.log("[Service] Response published: ".concat(result_1.published));
                        // Compare what we sent vs what we got back
                        console.log("[Service] === UPDATE COMPARISON ===");
                        console.log("[Service] Fields we sent:", Object.keys(cleanedUpdates_2));
                        console.log("[Service] Fields in response:", Object.keys(result_1));
                        // Check each field we updated
                        Object.keys(cleanedUpdates_2).forEach(function (key) {
                            var sentValue = cleanedUpdates_2[key];
                            var receivedValue = result_1[key];
                            if (sentValue !== receivedValue) {
                                console.warn("[Service] \u26A0\uFE0F  FIELD MISMATCH for ".concat(key, ":"));
                                console.warn("[Service]    Sent: ".concat(sentValue));
                                console.warn("[Service]    Received: ".concat(receivedValue));
                            }
                            else {
                                console.log("[Service] \u2713 Field ".concat(key, " matches: ").concat(sentValue));
                            }
                        });
                        if (!(cleanedUpdates_2.due_at && result_1.assignment_id)) return [3 /*break*/, 12];
                        console.log("[Service] Quiz has assignment_id ".concat(result_1.assignment_id, ", updating assignment due date as well"));
                        console.log("[Service] Updating assignment ".concat(result_1.assignment_id, " with due_at: ").concat(cleanedUpdates_2.due_at));
                        _b.label = 8;
                    case 8:
                        _b.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, this.updateAssignment(courseId, result_1.assignment_id, { due_at: cleanedUpdates_2.due_at })];
                    case 9:
                        assignmentResult = _b.sent();
                        console.log("[Service] \u2713 Successfully updated assignment ".concat(result_1.assignment_id, " due date"));
                        console.log("[Service] Assignment response due_at: ".concat(assignmentResult.due_at || 'null/undefined'));
                        return [3 /*break*/, 11];
                    case 10:
                        assignmentError_1 = _b.sent();
                        console.error("[Service] \u2717 Failed to update assignment due date:", assignmentError_1.message);
                        console.error("[Service] Assignment error stack:", assignmentError_1.stack);
                        // Don't throw - the quiz update succeeded, this is just a warning
                        console.warn("[Service] \u26A0\uFE0F  Quiz due date updated, but assignment due date update failed. The quiz due date may not display correctly in Canvas.");
                        return [3 /*break*/, 11];
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        if (cleanedUpdates_2.due_at && !result_1.assignment_id) {
                            console.log("[Service] Quiz does not have an assignment_id (likely a practice quiz or ungraded survey)");
                        }
                        _b.label = 13;
                    case 13:
                        // Check if due_at was actually updated in the response
                        if (cleanedUpdates_2.due_at) {
                            if (result_1.due_at) {
                                console.log("[Service] Due date comparison:");
                                console.log("[Service]   Request: ".concat(cleanedUpdates_2.due_at));
                                console.log("[Service]   Response: ".concat(result_1.due_at));
                                if (cleanedUpdates_2.due_at !== result_1.due_at) {
                                    console.warn("[Service] \u26A0\uFE0F  WARNING: Due date mismatch!");
                                    console.warn("[Service]   Request: ".concat(cleanedUpdates_2.due_at));
                                    console.warn("[Service]   Response: ".concat(result_1.due_at));
                                }
                                else {
                                    console.log("[Service] \u2713 Due date matches in response");
                                }
                            }
                            else {
                                console.warn("[Service] \u26A0\uFE0F  WARNING: Sent due_at but it's not in the response!");
                                console.warn("[Service]   This is normal for graded quizzes - the due date is stored on the assignment.");
                            }
                        }
                        return [2 /*return*/, result_1];
                    case 14:
                        error_17 = _b.sent();
                        console.error("[Service] Error in updateQuiz for quiz ".concat(quizId, ":"), error_17);
                        console.error("[Service] Error message:", error_17.message);
                        console.error("[Service] Error stack:", error_17.stack);
                        // Ensure we throw a proper error that NestJS can handle
                        if (error_17 instanceof Error) {
                            throw error_17;
                        }
                        else {
                            throw new Error("Failed to update quiz ".concat(quizId, ": ").concat(String(error_17)));
                        }
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.updateDiscussion = function (courseId, discussionId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, cleanedUpdates, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        cleanedUpdates = {};
                        Object.keys(updates).forEach(function (key) {
                            if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
                                cleanedUpdates[key] = updates[key];
                            }
                        });
                        console.log("Updating discussion ".concat(discussionId, " with:"), cleanedUpdates);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(cleanedUpdates),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        console.error("Discussion update failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                        throw new Error("Failed to update discussion: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.updatePage = function (courseId, pageUrl, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, cleanedUpdates, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        cleanedUpdates = {};
                        Object.keys(updates).forEach(function (key) {
                            if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
                                cleanedUpdates[key] = updates[key];
                            }
                        });
                        console.log("Updating page ".concat(pageUrl, " with:"), cleanedUpdates);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl)), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(cleanedUpdates),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        console.error("Page update failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                        throw new Error("Failed to update page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.updateAnnouncement = function (courseId, announcementId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, cleanedUpdates, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        cleanedUpdates = {};
                        Object.keys(updates).forEach(function (key) {
                            if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
                                cleanedUpdates[key] = updates[key];
                            }
                        });
                        console.log("Updating announcement ".concat(announcementId, " with:"), cleanedUpdates);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/announcements/").concat(announcementId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(cleanedUpdates),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        console.error("Announcement update failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                        throw new Error("Failed to update announcement: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.updateModule = function (courseId, moduleId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, cleanedUpdates, requestBody, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        cleanedUpdates = {};
                        Object.keys(updates).forEach(function (key) {
                            if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
                                cleanedUpdates[key] = updates[key];
                            }
                        });
                        console.log("Updating module ".concat(moduleId, " with:"), cleanedUpdates);
                        requestBody = { module: cleanedUpdates };
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        console.error("Module update failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                        throw new Error("Failed to update module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.bulkUpdateAssignments = function (courseId, itemIds, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, results, _i, itemIds_1, assignmentId, response, updated, error_18;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        _i = 0, itemIds_1 = itemIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < itemIds_1.length)) return [3 /*break*/, 8];
                        assignmentId = itemIds_1[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updates),
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to update assignment ".concat(assignmentId, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        updated = _b.sent();
                        results.push({ id: assignmentId, success: true, data: updated });
                        return [3 /*break*/, 7];
                    case 6:
                        error_18 = _b.sent();
                        results.push({ id: assignmentId, success: false, error: error_18.message });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    CanvasService.prototype.bulkUpdateQuizzes = function (courseId, itemIds, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, results, _i, itemIds_2, quizId, response, updated, error_19;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        _i = 0, itemIds_2 = itemIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < itemIds_2.length)) return [3 /*break*/, 8];
                        quizId = itemIds_2[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updates),
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to update quiz ".concat(quizId, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        updated = _b.sent();
                        results.push({ id: quizId, success: true, data: updated });
                        return [3 /*break*/, 7];
                    case 6:
                        error_19 = _b.sent();
                        results.push({ id: quizId, success: false, error: error_19.message });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    CanvasService.prototype.bulkUpdateDiscussions = function (courseId, itemIds, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, results, _i, itemIds_3, discussionId, response, updated, error_20;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        _i = 0, itemIds_3 = itemIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < itemIds_3.length)) return [3 /*break*/, 8];
                        discussionId = itemIds_3[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updates),
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to update discussion ".concat(discussionId, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        updated = _b.sent();
                        results.push({ id: discussionId, success: true, data: updated });
                        return [3 /*break*/, 7];
                    case 6:
                        error_20 = _b.sent();
                        results.push({ id: discussionId, success: false, error: error_20.message });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    CanvasService.prototype.bulkUpdatePages = function (courseId, itemIds, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, results, _i, itemIds_4, pageUrl, response, updated, error_21;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        _i = 0, itemIds_4 = itemIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < itemIds_4.length)) return [3 /*break*/, 8];
                        pageUrl = itemIds_4[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl)), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updates),
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to update page ".concat(pageUrl, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        updated = _b.sent();
                        results.push({ id: pageUrl, success: true, data: updated });
                        return [3 /*break*/, 7];
                    case 6:
                        error_21 = _b.sent();
                        results.push({ id: pageUrl, success: false, error: error_21.message });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    CanvasService.prototype.bulkUpdateAnnouncements = function (courseId, itemIds, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, results, _i, itemIds_5, announcementId, response, updated, error_22;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        _i = 0, itemIds_5 = itemIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < itemIds_5.length)) return [3 /*break*/, 8];
                        announcementId = itemIds_5[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/announcements/").concat(announcementId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updates),
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to update announcement ".concat(announcementId, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        updated = _b.sent();
                        results.push({ id: announcementId, success: true, data: updated });
                        return [3 /*break*/, 7];
                    case 6:
                        error_22 = _b.sent();
                        results.push({ id: announcementId, success: false, error: error_22.message });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    CanvasService.prototype.bulkUpdateModules = function (courseId, itemIds, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, results, _i, itemIds_6, moduleId, response, updated, error_23;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        results = [];
                        _i = 0, itemIds_6 = itemIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < itemIds_6.length)) return [3 /*break*/, 8];
                        moduleId = itemIds_6[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId), {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updates),
                            })];
                    case 4:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("Failed to update module ".concat(moduleId, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        updated = _b.sent();
                        results.push({ id: moduleId, success: true, data: updated });
                        return [3 /*break*/, 7];
                    case 6:
                        error_23 = _b.sent();
                        results.push({ id: moduleId, success: false, error: error_23.message });
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    CanvasService.prototype.getBulkUserTags = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, bulkTagsUrl, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        bulkTagsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/bulk_user_tags");
                        return [4 /*yield*/, fetch(bulkTagsUrl, {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API Error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.ensureAccommodationColumns = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, columnTitle, columnsUrl, existingColumns, existingColumn, updateUrl, updateResponse, errorText, updatedColumn, createUrl, response, errorText, newColumn, error_24;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("[COLUMN_CREATE] ===== Starting ensureAccommodationColumns for course ".concat(courseId, " ====="));
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        columnTitle = 'Accommodations';
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 14, , 15]);
                        console.log("[COLUMN_CREATE] Fetching existing columns from: ".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns"));
                        columnsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns?per_page=100&include_hidden=true");
                        return [4 /*yield*/, this.fetchPaginatedData(columnsUrl, token)];
                    case 3:
                        existingColumns = _b.sent();
                        console.log("[COLUMN_CREATE] Found ".concat(existingColumns.length, " existing columns"));
                        existingColumn = existingColumns.find(function (col) { return col.title === columnTitle; });
                        if (!existingColumn) return [3 /*break*/, 9];
                        console.log("[COLUMN_CREATE] Column \"".concat(columnTitle, "\" already exists (ID: ").concat(existingColumn.id, ")"));
                        console.log("[COLUMN_CREATE] Current state - hidden: ".concat(existingColumn.hidden, ", position: ").concat(existingColumn.position));
                        if (!existingColumn.hidden) return [3 /*break*/, 8];
                        console.log("[COLUMN_CREATE] Updating existing column \"".concat(columnTitle, "\" to hidden=false"));
                        updateUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns/").concat(existingColumn.id);
                        console.log("[COLUMN_CREATE] Update URL: ".concat(updateUrl));
                        return [4 /*yield*/, fetch(updateUrl, {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    column: {
                                        title: columnTitle,
                                        position: 1,
                                        hidden: false
                                    }
                                }),
                            })];
                    case 4:
                        updateResponse = _b.sent();
                        if (!!updateResponse.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, updateResponse.text()];
                    case 5:
                        errorText = _b.sent();
                        console.error("[COLUMN_CREATE] Failed to update column \"".concat(columnTitle, "\": ").concat(updateResponse.status, " ").concat(updateResponse.statusText, " - ").concat(errorText));
                        throw new Error("Failed to update column \"".concat(columnTitle, "\": ").concat(updateResponse.status, " ").concat(updateResponse.statusText, " - ").concat(errorText));
                    case 6: return [4 /*yield*/, updateResponse.json()];
                    case 7:
                        updatedColumn = _b.sent();
                        console.log("[COLUMN_CREATE] Successfully updated column \"".concat(columnTitle, "\" (ID: ").concat(updatedColumn.id, ", hidden: ").concat(updatedColumn.hidden, ")"));
                        console.log("[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ".concat(courseId, " ====="));
                        return [2 /*return*/, { column: updatedColumn }];
                    case 8:
                        console.log("[COLUMN_CREATE] Column \"".concat(columnTitle, "\" already has hidden=false, no update needed"));
                        console.log("[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ".concat(courseId, " ====="));
                        return [2 /*return*/, { column: existingColumn }];
                    case 9:
                        console.log("[COLUMN_CREATE] Column \"".concat(columnTitle, "\" does not exist, creating new column"));
                        createUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns");
                        console.log("[COLUMN_CREATE] Create URL: ".concat(createUrl));
                        console.log("[COLUMN_CREATE] Request body:", JSON.stringify({
                            column: {
                                title: columnTitle,
                                position: 1,
                                hidden: false
                            }
                        }, null, 2));
                        return [4 /*yield*/, fetch(createUrl, {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    column: {
                                        title: columnTitle,
                                        position: 1,
                                        hidden: false
                                    }
                                }),
                            })];
                    case 10:
                        response = _b.sent();
                        console.log("[COLUMN_CREATE] Create response status: ".concat(response.status, " ").concat(response.statusText));
                        if (!!response.ok) return [3 /*break*/, 12];
                        return [4 /*yield*/, response.text()];
                    case 11:
                        errorText = _b.sent();
                        console.error("[COLUMN_CREATE] Failed to create column \"".concat(columnTitle, "\": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        throw new Error("Failed to create column \"".concat(columnTitle, "\": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 12: return [4 /*yield*/, response.json()];
                    case 13:
                        newColumn = _b.sent();
                        console.log("[COLUMN_CREATE] Successfully created column \"".concat(columnTitle, "\" (ID: ").concat(newColumn.id, ", hidden: ").concat(newColumn.hidden, ", position: ").concat(newColumn.position, ")"));
                        console.log("[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ".concat(courseId, " ====="));
                        return [2 /*return*/, { column: newColumn }];
                    case 14:
                        error_24 = _b.sent();
                        console.error("[COLUMN_CREATE] Error ensuring accommodation columns:", error_24);
                        throw new Error("Failed to ensure accommodation columns: ".concat(error_24.message));
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.saveAccommodationValue = function (courseId, columnId, userId, content) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns/").concat(columnId, "/data/").concat(userId);
                        return [4 /*yield*/, fetch(url, {
                                method: 'PUT',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    column_data: {
                                        content: content
                                    }
                                }),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to save accommodation value: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getAccommodationData = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, column, _b, studentToken, studentBaseUrl, allStudents, url, response, chunk, linkHeader, studentMap_1, accommodationData_1, dataUrl, currentUrl, response, chunk, linkHeader, error_25;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 13, , 14]);
                        return [4 /*yield*/, this.ensureAccommodationColumns(courseId)];
                    case 3:
                        column = (_c.sent()).column;
                        return [4 /*yield*/, this.getAuthHeaders()];
                    case 4:
                        _b = _c.sent(), studentToken = _b.token, studentBaseUrl = _b.baseUrl;
                        allStudents = [];
                        url = "".concat(studentBaseUrl, "/courses/").concat(courseId, "/enrollments?per_page=100&type[]=StudentEnrollment&include[]=user");
                        _c.label = 5;
                    case 5:
                        if (!url) return [3 /*break*/, 8];
                        return [4 /*yield*/, fetch(url, {
                                headers: { Authorization: "Bearer ".concat(studentToken) },
                            })];
                    case 6:
                        response = _c.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch students: ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 7:
                        chunk = _c.sent();
                        if (Array.isArray(chunk)) {
                            allStudents.push.apply(allStudents, chunk);
                        }
                        linkHeader = response.headers.get('link');
                        url = this.getNextUrl(linkHeader);
                        return [3 /*break*/, 5];
                    case 8:
                        studentMap_1 = new Map();
                        allStudents.forEach(function (enrollment) {
                            var _a, _b, _c;
                            var userId = ((_a = enrollment.user) === null || _a === void 0 ? void 0 : _a.id) || enrollment.user_id;
                            if (userId) {
                                var userName = ((_b = enrollment.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = enrollment.user) === null || _c === void 0 ? void 0 : _c.display_name) || 'Unknown';
                                studentMap_1.set(userId, userName);
                            }
                        });
                        accommodationData_1 = {};
                        dataUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns/").concat(column.id, "/data");
                        currentUrl = "".concat(dataUrl, "?per_page=100");
                        _c.label = 9;
                    case 9:
                        if (!currentUrl) return [3 /*break*/, 12];
                        return [4 /*yield*/, fetch(currentUrl, {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 10:
                        response = _c.sent();
                        if (!response.ok) {
                            if (response.status === 404) {
                                return [3 /*break*/, 12];
                            }
                            throw new Error("Failed to fetch column data: ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 11:
                        chunk = _c.sent();
                        if (Array.isArray(chunk)) {
                            chunk.forEach(function (item) {
                                if (item.user_id && item.content && item.content.trim()) {
                                    var userId = String(item.user_id);
                                    accommodationData_1[userId] = item.content.trim();
                                    var userName = studentMap_1.get(item.user_id) || 'Unknown';
                                    console.log("[Request] ".concat(userName, ": \"").concat(item.content.trim(), "\""));
                                }
                            });
                        }
                        linkHeader = response.headers.get('link');
                        currentUrl = this.getNextUrl(linkHeader);
                        return [3 /*break*/, 9];
                    case 12:
                        studentMap_1.forEach(function (userName, userId) {
                            if (!accommodationData_1[String(userId)]) {
                                console.log("[Request] ".concat(userName, ": No accommodation"));
                            }
                        });
                        return [2 /*return*/, accommodationData_1];
                    case 13:
                        error_25 = _c.sent();
                        console.error("[getAccommodationData] Error:", error_25);
                        throw new Error("Failed to fetch accommodation data: ".concat(error_25.message));
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.getCustomGradebookColumns = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, columnsUrl, columns;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        console.log("[TEST] Fetching all custom gradebook columns for course ".concat(courseId));
                        columnsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns?per_page=100&include_hidden=true");
                        return [4 /*yield*/, this.fetchPaginatedData(columnsUrl, token)];
                    case 2:
                        columns = _b.sent();
                        console.log("[TEST] Found ".concat(columns.length, " custom gradebook columns"));
                        columns.forEach(function (col) {
                            console.log("[TEST] Column: \"".concat(col.title, "\" (ID: ").concat(col.id, ", hidden: ").concat(col.hidden, ", position: ").concat(col.position, ", teacher_notes: ").concat(col.teacher_notes, ")"));
                        });
                        return [2 /*return*/, columns];
                }
            });
        });
    };
    // Delete methods
    CanvasService.prototype.deleteAssignment = function (courseId, assignmentId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId), {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _c.sent();
                        throw new Error("Failed to delete assignment: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4:
                        // DELETE endpoints typically return 200 OK with the deleted object, or 204 No Content
                        if (response.status === 204) {
                            return [2 /*return*/, { success: true }];
                        }
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, response.json()];
                    case 6: return [2 /*return*/, _c.sent()];
                    case 7:
                        _b = _c.sent();
                        return [2 /*return*/, { success: true }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.deleteQuiz = function (courseId, quizId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId), {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _c.sent();
                        throw new Error("Failed to delete quiz: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4:
                        if (response.status === 204) {
                            return [2 /*return*/, { success: true }];
                        }
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, response.json()];
                    case 6: return [2 /*return*/, _c.sent()];
                    case 7:
                        _b = _c.sent();
                        return [2 /*return*/, { success: true }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.deleteDiscussion = function (courseId, discussionId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId), {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _c.sent();
                        throw new Error("Failed to delete discussion: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4:
                        if (response.status === 204) {
                            return [2 /*return*/, { success: true }];
                        }
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, response.json()];
                    case 6: return [2 /*return*/, _c.sent()];
                    case 7:
                        _b = _c.sent();
                        return [2 /*return*/, { success: true }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.deletePage = function (courseId, pageUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl)), {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _c.sent();
                        throw new Error("Failed to delete page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4:
                        if (response.status === 204) {
                            return [2 /*return*/, { success: true }];
                        }
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, response.json()];
                    case 6: return [2 /*return*/, _c.sent()];
                    case 7:
                        _b = _c.sent();
                        return [2 /*return*/, { success: true }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.deleteAnnouncement = function (courseId, announcementId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Announcements are discussions, so use the same endpoint
                return [2 /*return*/, this.deleteDiscussion(courseId, announcementId)];
            });
        });
    };
    // Content Export
    CanvasService.prototype.createContentExport = function (courseId_1) {
        return __awaiter(this, arguments, void 0, function (courseId, exportType) {
            var _a, token, baseUrl, response, errorText;
            if (exportType === void 0) { exportType = 'common_cartridge'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/content_exports"), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    export_type: exportType,
                                }),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to create content export: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    // Create methods (for duplication)
    CanvasService.prototype.createAssignment = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, requestBody, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        requestBody = body.assignment ? body : { assignment: body };
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments"), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to create assignment: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.createQuiz = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, requestBody, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        requestBody = body.quiz ? body : { quiz: body };
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes"), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to create quiz: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.createDiscussion = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics"), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(body),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to create discussion: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.createPage = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, requestBody, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        requestBody = body.wiki_page ? body : { wiki_page: body };
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages"), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to create page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.createAnnouncement = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var announcementBody;
            return __generator(this, function (_a) {
                announcementBody = __assign(__assign({}, body), { is_announcement: true });
                return [2 /*return*/, this.createDiscussion(courseId, announcementBody)];
            });
        });
    };
    CanvasService.prototype.createQuizExtensions = function (courseId, quizId, extensions) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId, "/extensions");
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ quiz_extensions: extensions }),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getAssignmentOverrides = function (courseId, assignmentId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId, "/overrides");
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.deleteAssignmentOverride = function (courseId, assignmentId, overrideId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId, "/overrides/").concat(overrideId);
                        return [4 /*yield*/, fetch(url, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.createAssignmentOverride = function (courseId, assignmentId, override) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId, "/overrides");
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ assignment_override: override }),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getModule = function (courseId, moduleId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, lastError, attempt, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        lastError = null;
                        attempt = 0;
                        _b.label = 2;
                    case 2:
                        if (!(attempt < 3)) return [3 /*break*/, 10];
                        if (!(attempt > 0)) return [3 /*break*/, 4];
                        // Wait 500ms before retry
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 3:
                        // Wait 500ms before retry
                        _b.sent();
                        _b.label = 4;
                    case 4: return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId, "?include[]=items"), {
                            headers: { Authorization: "Bearer ".concat(token) },
                        })];
                    case 5:
                        response = _b.sent();
                        if (!response.ok) return [3 /*break*/, 7];
                        return [4 /*yield*/, response.json()];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7:
                        if (!(response.status !== 404 || attempt === 2)) return [3 /*break*/, 9];
                        return [4 /*yield*/, response.text()];
                    case 8:
                        errorText = _b.sent();
                        lastError = new Error("Failed to get module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        if (response.status !== 404) {
                            throw lastError;
                        }
                        _b.label = 9;
                    case 9:
                        attempt++;
                        return [3 /*break*/, 2];
                    case 10: 
                    // If we get here, all retries failed with 404
                    throw lastError || new Error("Failed to get module: Resource not found after retries");
                }
            });
        });
    };
    CanvasService.prototype.createModule = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, cleanedBody, requestBody, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        cleanedBody = {};
                        Object.keys(body).forEach(function (key) {
                            var value = body[key];
                            if (value !== null && value !== undefined && value !== '') {
                                cleanedBody[key] = value;
                            }
                        });
                        console.log("Creating module in course ".concat(courseId, " with:"), cleanedBody);
                        requestBody = body.module ? body : { module: cleanedBody };
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules"), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        console.error("Module creation failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                        throw new Error("Failed to create module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.deleteModule = function (courseId, moduleId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, response, errorText, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId), {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 2:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _c.sent();
                        throw new Error("Failed to delete module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4:
                        if (response.status === 204) {
                            return [2 /*return*/, { success: true }];
                        }
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, response.json()];
                    case 6: return [2 /*return*/, _c.sent()];
                    case 7:
                        _b = _c.sent();
                        return [2 /*return*/, { success: true }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.createModuleItem = function (courseId, moduleId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, requestBody, response, errorText;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        requestBody = body.module_item ? body : { module_item: body };
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId, "/items"), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("Failed to create module item: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    CanvasService.prototype.getModuleItems = function (courseId, moduleId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, items, error_26;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId, "/items?per_page=100");
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 3:
                        items = _b.sent();
                        console.log("[Service] Retrieved ".concat(items.length, " items for module ").concat(moduleId, " in course ").concat(courseId));
                        return [2 /*return*/, items];
                    case 4:
                        error_26 = _b.sent();
                        console.error("[Service] Error in getModuleItems for module ".concat(moduleId, " in course ").concat(courseId, ":"), error_26);
                        throw error_26;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.prototype.deleteModuleItem = function (courseId, item) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, deleteUrl, response, errorText, result, _b, error_27;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 10, , 11]);
                        deleteUrl = void 0;
                        if (item.type === 'Assignment') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(item.content_id);
                        }
                        else if (item.type === 'Quiz') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(item.content_id);
                        }
                        else if (item.type === 'Page') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(item.content_id));
                        }
                        else if (item.type === 'Discussion') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(item.content_id);
                        }
                        else if (item.type === 'File' || item.type === 'Attachment') {
                            deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/files/").concat(item.content_id);
                        }
                        else {
                            throw new Error("Unsupported module item type: ".concat(item.type));
                        }
                        return [4 /*yield*/, fetch(deleteUrl, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: "Bearer ".concat(token),
                                },
                            })];
                    case 3:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, response.text()];
                    case 4:
                        errorText = _c.sent();
                        throw new Error("Failed to delete ".concat(item.type, " ").concat(item.content_id, ": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    case 5:
                        if (response.status === 204) {
                            return [2 /*return*/, { success: true, type: item.type, content_id: item.content_id }];
                        }
                        _c.label = 6;
                    case 6:
                        _c.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, response.json()];
                    case 7:
                        result = _c.sent();
                        return [2 /*return*/, { success: true, type: item.type, content_id: item.content_id, result: result }];
                    case 8:
                        _b = _c.sent();
                        return [2 /*return*/, { success: true, type: item.type, content_id: item.content_id }];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_27 = _c.sent();
                        console.error("[Service] Error deleting module item ".concat(item.type, " ").concat(item.content_id, ":"), error_27);
                        throw error_27;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    CanvasService.parseAccreditationBlock = function (body) {
        var _a, _b, _c;
        var raw = body !== null && body !== void 0 ? body : '';
        var preRegex = new RegExp("<pre[^>]*class=[\"'][^\"']*".concat(CanvasService_1.ACCREDITATION_PRE_CLASS, "[^\"']*[\"'][^>]*>([\\s\\S]*?)</pre>"), 'i');
        var text = (_c = (_b = (_a = raw.match(preRegex)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
        if (!text) {
            text = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n').replace(/<[^>]+>/g, '');
            if (!text) {
                var legacyMatch = raw.match(/<!--\s*accreditation:(.+?)\s*-->/s);
                if (legacyMatch) {
                    try {
                        var parsed = JSON.parse(legacyMatch[1].trim());
                        return typeof parsed === 'object' && parsed !== null ? parsed : null;
                    }
                    catch ( /* fall through */_d) { /* fall through */ }
                }
                return null;
            }
        }
        var profile = { v: 1 };
        var _loop_3 = function (line) {
            var m = line.match(/^([^:]+):\s*(.*)$/);
            if (!m)
                return "continue";
            var label = m[1].trim();
            var value = m[2].trim();
            var def = CanvasService_1.PROFILE_KEYS.find(function (d) { return d.label === label; });
            if (!def || !value)
                return "continue";
            if (def.key === 'institutionId')
                profile[def.key] = parseInt(value, 10) || value;
            else if (def.key === 'programFocusCip6' || def.key === 'selectedStandards')
                profile[def.key] = value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            else
                profile[def.key] = value;
        };
        for (var _i = 0, _e = text.split(/\r?\n/); _i < _e.length; _i++) {
            var line = _e[_i];
            _loop_3(line);
        }
        return profile;
    };
    CanvasService.buildAccreditationBlock = function (profile) {
        var lines = CanvasService_1.PROFILE_KEYS.map(function (d) {
            var v = profile[d.key];
            if (v == null)
                return null;
            if ((d.key === 'programFocusCip6' || d.key === 'selectedStandards') && Array.isArray(v))
                return v.length ? "".concat(d.label, ": ").concat(v.join(',')) : null;
            var s = String(v).trim();
            return s ? "".concat(d.label, ": ").concat(s) : null;
        })
            .filter(Boolean);
        var inner = lines.length ? lines.join('\n') : 'No profile data yet. Use the Standards Sync tab to set State, City, Institution, and Program.';
        return "<pre class=\"".concat(CanvasService_1.ACCREDITATION_PRE_CLASS, "\">").concat(inner, "</pre>");
    };
    CanvasService.mergeAccreditationBlockInBody = function (body, profile) {
        var block = CanvasService_1.buildAccreditationBlock(profile);
        var preRegex = new RegExp("<pre[^>]*class=[\"'][^\"']*".concat(CanvasService_1.ACCREDITATION_PRE_CLASS, "[^\"']*[\"'][^>]*>[\\s\\S]*?</pre>"), 'gi');
        var legacyRegex = /<!--\s*accreditation:.+?\s*-->/s;
        var out = body !== null && body !== void 0 ? body : '';
        if (preRegex.test(out)) {
            out = out.replace(preRegex, block);
        }
        else if (legacyRegex.test(out)) {
            out = out.replace(legacyRegex, block);
        }
        else {
            out = out.trim() ? "".concat(block, "\n\n").concat(out) : block;
        }
        return out.trim();
    };
    CanvasService.prototype.ensureStartHereModule = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var modules, existing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCourseModules(courseId)];
                    case 1:
                        modules = _a.sent();
                        existing = modules.find(function (m) { var _a; return ((_a = m.name) !== null && _a !== void 0 ? _a : '').trim().toLowerCase() === CanvasService_1.START_HERE_MODULE_NAME.toLowerCase(); });
                        if (existing)
                            return [2 /*return*/, existing];
                        return [2 /*return*/, this.createModule(courseId, { name: CanvasService_1.START_HERE_MODULE_NAME })];
                }
            });
        });
    };
    CanvasService.prototype.getOrCreateAccreditationProfilePage = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var startHere, pages, existing, items, inModule, initialBody, created, pageUrl;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ensureStartHereModule(courseId)];
                    case 1:
                        startHere = _b.sent();
                        return [4 /*yield*/, this.getCoursePages(courseId)];
                    case 2:
                        pages = _b.sent();
                        existing = pages.find(function (p) { var _a; return ((_a = p.url) !== null && _a !== void 0 ? _a : '').toLowerCase() === CanvasService_1.ACCREDITATION_PROFILE_PAGE_URL.toLowerCase(); });
                        if (!existing) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getModuleItems(courseId, startHere.id)];
                    case 3:
                        items = _b.sent();
                        inModule = items.some(function (i) { var _a; return i.type === 'Page' && ((_a = i.page_url) !== null && _a !== void 0 ? _a : '').toLowerCase() === CanvasService_1.ACCREDITATION_PROFILE_PAGE_URL.toLowerCase(); });
                        if (!!inModule) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.createModuleItem(courseId, startHere.id, {
                                type: 'Page',
                                page_url: existing.url || CanvasService_1.ACCREDITATION_PROFILE_PAGE_URL,
                            })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/, { page: existing, module: startHere }];
                    case 6:
                        initialBody = CanvasService_1.buildAccreditationBlock({ v: 1 });
                        return [4 /*yield*/, this.createPage(courseId, {
                                wiki_page: { title: 'Accreditation Profile', body: initialBody },
                            })];
                    case 7:
                        created = _b.sent();
                        pageUrl = (_a = created.url) !== null && _a !== void 0 ? _a : CanvasService_1.ACCREDITATION_PROFILE_PAGE_URL;
                        return [4 /*yield*/, this.createModuleItem(courseId, startHere.id, { type: 'Page', page_url: pageUrl })];
                    case 8:
                        _b.sent();
                        return [2 /*return*/, { page: created, module: startHere }];
                }
            });
        });
    };
    CanvasService.prototype.getAccreditationProfile = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var page, body, profile;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getOrCreateAccreditationProfilePage(courseId)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.getPage(courseId, CanvasService_1.ACCREDITATION_PROFILE_PAGE_URL)];
                    case 2:
                        page = _b.sent();
                        body = (_a = page === null || page === void 0 ? void 0 : page.body) !== null && _a !== void 0 ? _a : '';
                        profile = CanvasService_1.parseAccreditationBlock(body);
                        return [2 /*return*/, profile !== null && profile !== void 0 ? profile : { v: 1 }];
                }
            });
        });
    };
    CanvasService.prototype.saveAccreditationProfile = function (courseId, profile) {
        return __awaiter(this, void 0, void 0, function () {
            var pageUrl, page, merged;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getOrCreateAccreditationProfilePage(courseId)];
                    case 1:
                        _b.sent();
                        pageUrl = CanvasService_1.ACCREDITATION_PROFILE_PAGE_URL;
                        return [4 /*yield*/, this.getPage(courseId, pageUrl)];
                    case 2:
                        page = _b.sent();
                        merged = CanvasService_1.mergeAccreditationBlockInBody((_a = page === null || page === void 0 ? void 0 : page.body) !== null && _a !== void 0 ? _a : '', profile);
                        return [2 /*return*/, this.updatePage(courseId, pageUrl, { wiki_page: { body: merged } })];
                }
            });
        });
    };
    CanvasService.prototype.getAccreditorsForCourse = function (courseId, cip, degreeLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var cipParam, profile, p, cipKey, base, params, deg, res, data, list, e_1, stub;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cipParam = (cip || '').trim();
                        if (!!cipParam) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                    case 1:
                        profile = _b.sent();
                        p = profile;
                        cipParam = (p === null || p === void 0 ? void 0 : p.programCip4) || (p === null || p === void 0 ? void 0 : p.program) || '';
                        _b.label = 2;
                    case 2:
                        if (!cipParam)
                            return [2 /*return*/, { accreditors: [], source: 'stub' }];
                        cipKey = cipParam.includes('.') ? cipParam : cipParam.replace(/^(\d{2})(\d{2})$/, '$1.$2');
                        base = (this.config.get('ACCREDITATION_LOOKUP_URL') || '').replace(/\/$/, '');
                        if (!base) return [3 /*break*/, 8];
                        params = new URLSearchParams({ cip: cipParam });
                        deg = (degreeLevel || '').trim();
                        if (deg)
                            params.set('degree_level', deg);
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, fetch("".concat(base, "/accreditors?").concat(params))];
                    case 4:
                        res = _b.sent();
                        if (!res.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, res.json()];
                    case 5:
                        data = (_b.sent());
                        list = Array.isArray(data === null || data === void 0 ? void 0 : data.accreditors) ? data.accreditors : [];
                        if (list.length) {
                            console.log('[Accreditation] Fetched from lookup service:', { cip: cipParam, degree_level: deg || null, count: list.length, accreditors: list });
                            return [2 /*return*/, { accreditors: list, source: 'lookup_service' }];
                        }
                        _b.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _b.sent();
                        console.warn('[Accreditation] Lookup service fetch failed:', e_1);
                        return [3 /*break*/, 8];
                    case 8:
                        stub = (_a = CanvasService_1.STUB_ACCREDITORS_BY_CIP[cipKey]) !== null && _a !== void 0 ? _a : [];
                        return [2 /*return*/, { accreditors: stub, source: 'stub' }];
                }
            });
        });
    };
    CanvasService.parseStandardsFromDescription = function (description) {
        if (!description || typeof description !== 'string')
            return null;
        var match = description.match(CanvasService_1.STANDARDS_PREFIX_REGEX);
        if (!match)
            return null;
        return match[1].split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    };
    CanvasService.mergeStandardsIntoDescription = function (description, standards) {
        var base = (description !== null && description !== void 0 ? description : '').trim();
        var block = standards.length ? "|STANDARDS:".concat(standards.join(','), "|") : '';
        if (!block) {
            return base.replace(CanvasService_1.STANDARDS_PREFIX_REGEX, '').trim();
        }
        if (CanvasService_1.STANDARDS_PREFIX_REGEX.test(base)) {
            return base.replace(CanvasService_1.STANDARDS_PREFIX_REGEX, block).trim();
        }
        return base ? "".concat(block, " ").concat(base) : block;
    };
    CanvasService.prototype.getCourseOutcomeLinks = function (courseId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, url, links;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        url = "".concat(baseUrl, "/courses/").concat(courseId, "/outcome_group_links?outcome_style=full&per_page=100");
                        return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                    case 2:
                        links = _b.sent();
                        return [2 /*return*/, links.map(function (link) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                                return ({
                                    id: (_a = link.outcome) === null || _a === void 0 ? void 0 : _a.id,
                                    title: (_c = (_b = link.outcome) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : '',
                                    description: (_e = (_d = link.outcome) === null || _d === void 0 ? void 0 : _d.description) !== null && _e !== void 0 ? _e : '',
                                    groupTitle: (_g = (_f = link.outcome_group) === null || _f === void 0 ? void 0 : _f.title) !== null && _g !== void 0 ? _g : null,
                                    standards: (_j = CanvasService_1.parseStandardsFromDescription((_h = link.outcome) === null || _h === void 0 ? void 0 : _h.description)) !== null && _j !== void 0 ? _j : [],
                                });
                            })];
                }
            });
        });
    };
    CanvasService.prototype.updateOutcomeStandards = function (outcomeId, standards) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, token, baseUrl, getRes, outcome, merged, putRes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAuthHeaders()];
                    case 1:
                        _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/outcomes/").concat(outcomeId), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                    case 2:
                        getRes = _b.sent();
                        if (!getRes.ok)
                            throw new Error("Failed to fetch outcome: ".concat(getRes.statusText));
                        return [4 /*yield*/, getRes.json()];
                    case 3:
                        outcome = _b.sent();
                        merged = CanvasService_1.mergeStandardsIntoDescription(outcome.description, standards);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/outcomes/").concat(outcomeId), {
                                method: 'PUT',
                                headers: { Authorization: "Bearer ".concat(token), 'Content-Type': 'application/json' },
                                body: JSON.stringify({ description: merged }),
                            })];
                    case 4:
                        putRes = _b.sent();
                        if (!putRes.ok)
                            throw new Error("Failed to update outcome: ".concat(putRes.statusText));
                        return [2 /*return*/, putRes.json()];
                }
            });
        });
    };
    var CanvasService_1;
    CanvasService.ACCREDITATION_PROFILE_PAGE_URL = 'accreditation-profile';
    CanvasService.START_HERE_MODULE_NAME = 'Start Here';
    CanvasService.ACCREDITATION_PRE_CLASS = 'accreditation-profile-data';
    CanvasService.PROFILE_KEYS = [
        { key: 'state', label: 'State' },
        { key: 'city', label: 'City' },
        { key: 'institutionName', label: 'Institution' },
        { key: 'institutionId', label: 'Institution ID' },
        { key: 'program', label: 'Program' },
        { key: 'programCip4', label: 'Program CIP4' },
        { key: 'programTitle', label: 'Program Title' },
        { key: 'programFocusCip6', label: 'Program Focus CIP6' },
        { key: 'selectedStandards', label: 'Selected Standards' },
    ];
    CanvasService.STUB_ACCREDITORS_BY_CIP = {
        '16.16': [
            { id: 'QM', abbreviation: 'QM', name: 'Quality Matters' },
            { id: 'ACTFL', abbreviation: 'ACTFL', name: 'American Council on the Teaching of Foreign Languages' },
            { id: 'ASLTA', abbreviation: 'ASLTA', name: 'American Sign Language Teachers Association / NCIEC' },
            { id: 'CCIE', abbreviation: 'CCIE', name: 'Commission on Collegiate Interpreter Education' },
            { id: 'CED', abbreviation: 'CED', name: 'Council on Education of the Deaf' },
            { id: 'CEC', abbreviation: 'CEC', name: 'Council for Exceptional Children' },
            { id: 'BEI', abbreviation: 'BEI', name: 'Board for Evaluation of Interpreters (Texas)' },
            { id: 'RID', abbreviation: 'RID', name: 'Registry of Interpreters for the Deaf' },
        ],
    };
    CanvasService.STANDARDS_PREFIX_REGEX = /\|STANDARDS:([^|]+)\|/;
    CanvasService = CanvasService_1 = __decorate([
        (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
        __param(0, (0, common_1.Inject)(core_1.REQUEST)),
        __metadata("design:paramtypes", [Object, config_1.ConfigService])
    ], CanvasService);
    return CanvasService;
}());
exports.CanvasService = CanvasService;

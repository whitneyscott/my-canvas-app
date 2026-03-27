"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.CanvasController = void 0;
var common_1 = require("@nestjs/common");
var CanvasController = function () {
    var _classDecorators = [(0, common_1.Controller)('canvas')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getCourses_decorators;
    var _getCourseDetails_decorators;
    var _getCourseStudents_decorators;
    var _getCourseQuizzes_decorators;
    var _getCourseAssignments_decorators;
    var _getCourseNewQuizzes_decorators;
    var _getCourseAssignmentGroups_decorators;
    var _getCourseRubrics_decorators;
    var _createCourseRubric_decorators;
    var _createAssignmentGroup_decorators;
    var _updateAssignmentGroup_decorators;
    var _deleteAssignmentGroup_decorators;
    var _getCourseDiscussions_decorators;
    var _getCoursePages_decorators;
    var _getCourseAnnouncements_decorators;
    var _getCourseModules_decorators;
    var _getCourseFiles_decorators;
    var _getCourseAccommodations_decorators;
    var _ensureAccommodationColumns_decorators;
    var _getAccommodationData_decorators;
    var _saveAccommodationValue_decorators;
    var _getCustomGradebookColumns_decorators;
    var _getAccreditationProfile_decorators;
    var _saveAccreditationProfile_decorators;
    var _getAccreditors_decorators;
    var _suggestStandards_decorators;
    var _finalizeStandards_decorators;
    var _applyAiSuggestionAction_decorators;
    var _getAccreditationStandards_decorators;
    var _getCourseOutcomeLinks_decorators;
    var _getOutcomesPreview_decorators;
    var _syncOutcomesForOrg_decorators;
    var _syncCourseOutcomesFromStandards_decorators;
    var _getAccreditationWorkflow_decorators;
    var _getInstructionAlignment_decorators;
    var _createRubricForResource_decorators;
    var _applyResourceTagging_decorators;
    var _applyQuizTagging_decorators;
    var _applyNewQuizTagging_decorators;
    var _getAccreditationAlignment_decorators;
    var _getAccessibilityScan_decorators;
    var _getAccessibilityFixPreview_decorators;
    var _getAccessibilityFixPreviewItem_decorators;
    var _applyAccessibilityFixes_decorators;
    var _exportAccessibilityCsv_decorators;
    var _updateOutcomeStandards_decorators;
    var _getBulkUserTags_decorators;
    var _getAssignment_decorators;
    var _getQuiz_decorators;
    var _getDiscussion_decorators;
    var _getPage_decorators;
    var _getAnnouncement_decorators;
    var _getModule_decorators;
    var _updateNewQuiz_decorators;
    var _updateAssignment_decorators;
    var _updateQuiz_decorators;
    var _updateDiscussion_decorators;
    var _updatePage_decorators;
    var _updateAnnouncement_decorators;
    var _updateModule_decorators;
    var _bulkUpdateAssignments_decorators;
    var _bulkUpdateQuizzes_decorators;
    var _bulkUpdateDiscussions_decorators;
    var _bulkUpdatePages_decorators;
    var _bulkUpdateAnnouncements_decorators;
    var _bulkUpdateModules_decorators;
    var _deleteAssignment_decorators;
    var _deleteQuiz_decorators;
    var _deleteDiscussion_decorators;
    var _deletePage_decorators;
    var _deleteModule_decorators;
    var _deleteAnnouncement_decorators;
    var _createContentExport_decorators;
    var _createAssignment_decorators;
    var _createQuiz_decorators;
    var _createDiscussion_decorators;
    var _createPage_decorators;
    var _createAnnouncement_decorators;
    var _createModule_decorators;
    var _createNewQuiz_decorators;
    var _createQuizExtensions_decorators;
    var _getAssignmentOverrides_decorators;
    var _deleteAssignmentOverride_decorators;
    var _createAssignmentOverride_decorators;
    var _createModuleItem_decorators;
    var _getModuleItems_decorators;
    var _deleteModuleItem_decorators;
    var _bulkDeleteFiles_decorators;
    var _copyFile_decorators;
    var _createFolder_decorators;
    var _copyFolder_decorators;
    var _deleteFileOrFolder_decorators;
    var _updateFileOrFolder_decorators;
    var CanvasController = _classThis = /** @class */ (function () {
        function CanvasController_1(canvasService) {
            this.canvasService = (__runInitializers(this, _instanceExtraInitializers), canvasService);
        }
        CanvasController_1.prototype.getCourses = function () {
            return __awaiter(this, void 0, void 0, function () {
                var e_1, msg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.getCourses()];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            e_1 = _a.sent();
                            msg = e_1 instanceof Error ? e_1.message : String(e_1);
                            if (/no canvas token|unauthorized: no canvas/i.test(msg)) {
                                throw new common_1.HttpException(msg, common_1.HttpStatus.UNAUTHORIZED);
                            }
                            throw new common_1.HttpException(msg, common_1.HttpStatus.BAD_GATEWAY);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.getCourseDetails = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseDetails(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseStudents = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseStudents(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseQuizzes = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            console.log("[Controller] Getting quizzes for course ".concat(id));
                            return [4 /*yield*/, this.canvasService.getCourseQuizzes(id)];
                        case 1:
                            result = _a.sent();
                            console.log("[Controller] Successfully retrieved ".concat(result.length, " quizzes"));
                            return [2 /*return*/, result];
                        case 2:
                            error_1 = _a.sent();
                            console.error("[Controller] Error getting quizzes for course ".concat(id, ":"), error_1);
                            console.error("[Controller] Error message:", error_1.message);
                            console.error("[Controller] Error stack:", error_1.stack);
                            throw new common_1.HttpException({
                                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                                message: "Failed to load quizzes: ".concat(error_1.message || 'Unknown error'),
                                error: error_1.message || 'Internal server error',
                            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.getCourseAssignments = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseAssignments(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseNewQuizzes = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.getCourseNewQuizzes(id)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_2 = _a.sent();
                            throw new common_1.HttpException({
                                message: error_2.message || 'Failed to load New Quizzes',
                                error: String((error_2 === null || error_2 === void 0 ? void 0 : error_2.message) || error_2),
                            }, common_1.HttpStatus.BAD_GATEWAY);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.getCourseAssignmentGroups = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseAssignmentGroups(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseRubrics = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseRubrics(id)];
                });
            });
        };
        CanvasController_1.prototype.createCourseRubric = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createCourseRubric(courseId, body || {})];
                });
            });
        };
        CanvasController_1.prototype.createAssignmentGroup = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createAssignmentGroup(courseId, body.name, body.group_weight)];
                });
            });
        };
        CanvasController_1.prototype.updateAssignmentGroup = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.updateAssignmentGroup(courseId, id, updates)];
                });
            });
        };
        CanvasController_1.prototype.deleteAssignmentGroup = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteAssignmentGroup(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseDiscussions = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseDiscussions(id)];
                });
            });
        };
        CanvasController_1.prototype.getCoursePages = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCoursePages(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseAnnouncements = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseAnnouncements(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseModules = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseModules(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseFiles = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseFiles(id)];
                });
            });
        };
        CanvasController_1.prototype.getCourseAccommodations = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseAccommodations(id)];
                });
            });
        };
        CanvasController_1.prototype.ensureAccommodationColumns = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.ensureAccommodationColumns(id)];
                });
            });
        };
        CanvasController_1.prototype.getAccommodationData = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAccommodationData(id)];
                });
            });
        };
        CanvasController_1.prototype.saveAccommodationValue = function (courseId, columnId, userId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.saveAccommodationValue(courseId, columnId, userId, body.content)];
                });
            });
        };
        CanvasController_1.prototype.getCustomGradebookColumns = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCustomGradebookColumns(id)];
                });
            });
        };
        CanvasController_1.prototype.getAccreditationProfile = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAccreditationProfile(id)];
                });
            });
        };
        CanvasController_1.prototype.saveAccreditationProfile = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.saveAccreditationProfile(id, body.profile)];
                });
            });
        };
        CanvasController_1.prototype.getAccreditors = function (id, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAccreditorsForCourse(id, cip || undefined, degreeLevel || undefined)];
                });
            });
        };
        CanvasController_1.prototype.suggestStandards = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    return [2 /*return*/, this.canvasService.suggestAdditionalStandardsForCourse(id, (_a = body === null || body === void 0 ? void 0 : body.n) !== null && _a !== void 0 ? _a : 5)];
                });
            });
        };
        CanvasController_1.prototype.finalizeStandards = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.canvasService.setAccreditationStageState(id, '1', 'approved')];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.canvasService.logAccreditationOperation(id, 'standards_finalized', '1', {})];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        CanvasController_1.prototype.applyAiSuggestionAction = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.applyAiSuggestionAction(id, body.standardId, body.action)];
                });
            });
        };
        CanvasController_1.prototype.getAccreditationStandards = function (id, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAccreditationStandardsForCourse(id, cip || undefined, degreeLevel || undefined)];
                });
            });
        };
        CanvasController_1.prototype.getCourseOutcomeLinks = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getCourseOutcomeLinks(id)];
                });
            });
        };
        CanvasController_1.prototype.getOutcomesPreview = function (id, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getOutcomesPreviewByOrg(id, cip || undefined, degreeLevel || undefined)];
                });
            });
        };
        CanvasController_1.prototype.syncOutcomesForOrg = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var e_2, msg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.syncOutcomesForOrg(id, body.orgId, body.orgAbbrev || body.orgId, body.orgName || body.orgId, body.cip, undefined, body.selectedStandardIds)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            e_2 = _a.sent();
                            msg = (e_2 === null || e_2 === void 0 ? void 0 : e_2.message) || String(e_2);
                            console.error('[sync-org]', id, body.orgAbbrev || body.orgId, msg, e_2 === null || e_2 === void 0 ? void 0 : e_2.stack);
                            throw new common_1.HttpException(msg, 500);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.syncCourseOutcomesFromStandards = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.syncCourseOutcomesFromSelectedStandards(id, body === null || body === void 0 ? void 0 : body.cip, body === null || body === void 0 ? void 0 : body.degree_level, !!(body === null || body === void 0 ? void 0 : body.include_groups))];
                });
            });
        };
        CanvasController_1.prototype.getAccreditationWorkflow = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAccreditationWorkflow(id)];
                });
            });
        };
        CanvasController_1.prototype.getInstructionAlignment = function (id, cip) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getInstructionAlignmentSuggestions(id, cip || undefined)];
                });
            });
        };
        CanvasController_1.prototype.createRubricForResource = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    return [2 /*return*/, this.canvasService.createRubricForResource(id, body.resource_type, body.resource_id, (_a = body.criteria) !== null && _a !== void 0 ? _a : [])];
                });
            });
        };
        CanvasController_1.prototype.applyResourceTagging = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    return [2 /*return*/, this.canvasService.applyResourceTagging(id, body.resource_type, body.resource_id, (_a = body.standards) !== null && _a !== void 0 ? _a : [])];
                });
            });
        };
        CanvasController_1.prototype.applyQuizTagging = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    return [2 /*return*/, this.canvasService.applyQuizTagging(id, body.quiz_id, (_a = body.standards) !== null && _a !== void 0 ? _a : [])];
                });
            });
        };
        CanvasController_1.prototype.applyNewQuizTagging = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    return [2 /*return*/, this.canvasService.applyNewQuizTagging(id, body.assignment_id, (_a = body.standards) !== null && _a !== void 0 ? _a : [])];
                });
            });
        };
        CanvasController_1.prototype.getAccreditationAlignment = function (id, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAccreditationAlignment(id, cip || undefined, degreeLevel || undefined)];
                });
            });
        };
        CanvasController_1.prototype.getAccessibilityScan = function (id, baselineMsRaw, resourceTypesRaw, ruleIdsRaw) {
            return __awaiter(this, void 0, void 0, function () {
                var baselineMs, resourceTypes, ruleIds;
                return __generator(this, function (_a) {
                    baselineMs = baselineMsRaw != null && baselineMsRaw !== ''
                        ? Number(baselineMsRaw)
                        : undefined;
                    resourceTypes = (resourceTypesRaw || '')
                        .split(',')
                        .map(function (x) { return x.trim(); })
                        .filter(Boolean);
                    ruleIds = (ruleIdsRaw || '')
                        .split(',')
                        .map(function (x) { return x.trim(); })
                        .filter(Boolean);
                    return [2 /*return*/, this.canvasService.getAccessibilityScan(id, {
                            canvasNativeBaselineMs: Number.isFinite(baselineMs)
                                ? baselineMs
                                : undefined,
                            resourceTypes: resourceTypes.length ? resourceTypes : undefined,
                            ruleIds: ruleIds.length ? ruleIds : undefined,
                        })];
                });
            });
        };
        CanvasController_1.prototype.getAccessibilityFixPreview = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var findings;
                return __generator(this, function (_a) {
                    findings = Array.isArray(body === null || body === void 0 ? void 0 : body.findings) ? body.findings : [];
                    return [2 /*return*/, this.canvasService.getAccessibilityFixPreview(id, findings)];
                });
            });
        };
        CanvasController_1.prototype.getAccessibilityFixPreviewItem = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var action;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(body === null || body === void 0 ? void 0 : body.finding))
                                return [2 /*return*/, { action: null }];
                            return [4 /*yield*/, this.canvasService.getAccessibilityFixPreviewItem(id, body.finding)];
                        case 1:
                            action = _a.sent();
                            return [2 /*return*/, { action: action }];
                    }
                });
            });
        };
        CanvasController_1.prototype.applyAccessibilityFixes = function (id, body) {
            return __awaiter(this, void 0, void 0, function () {
                var actions;
                return __generator(this, function (_a) {
                    actions = Array.isArray(body === null || body === void 0 ? void 0 : body.actions) ? body.actions : [];
                    return [2 /*return*/, this.canvasService.applyAccessibilityFixes(id, actions)];
                });
            });
        };
        CanvasController_1.prototype.exportAccessibilityCsv = function (id, resourceTypesRaw, ruleIdsRaw) {
            return __awaiter(this, void 0, void 0, function () {
                var resourceTypes, ruleIds, report;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            resourceTypes = (resourceTypesRaw || '')
                                .split(',')
                                .map(function (x) { return x.trim(); })
                                .filter(Boolean);
                            ruleIds = (ruleIdsRaw || '')
                                .split(',')
                                .map(function (x) { return x.trim(); })
                                .filter(Boolean);
                            return [4 /*yield*/, this.canvasService.getAccessibilityScan(id, {
                                    resourceTypes: resourceTypes.length ? resourceTypes : undefined,
                                    ruleIds: ruleIds.length ? ruleIds : undefined,
                                })];
                        case 1:
                            report = _a.sent();
                            return [2 /*return*/, this.canvasService.buildAccessibilityCsv(report)];
                    }
                });
            });
        };
        CanvasController_1.prototype.updateOutcomeStandards = function (outcomeId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    return [2 /*return*/, this.canvasService.updateOutcomeStandards(outcomeId, (_a = body.standards) !== null && _a !== void 0 ? _a : [])];
                });
            });
        };
        CanvasController_1.prototype.getBulkUserTags = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getBulkUserTags(id)];
                });
            });
        };
        // Individual GET endpoints (for fetching full item data)
        CanvasController_1.prototype.getAssignment = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAssignment(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.getQuiz = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getQuiz(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.getDiscussion = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getDiscussion(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.getPage = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getPage(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.getAnnouncement = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAnnouncement(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.getModule = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getModule(courseId, id)];
                });
            });
        };
        // Individual update endpoints (for inline editing)
        CanvasController_1.prototype.updateNewQuiz = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.updateNewQuizRow(courseId, id, updates)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_3 = _a.sent();
                            throw new common_1.HttpException({
                                message: error_3.message || 'Failed to update New Quiz',
                                error: String((error_3 === null || error_3 === void 0 ? void 0 : error_3.message) || error_3),
                            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.updateAssignment = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.updateAssignment(courseId, id, updates)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_4 = _a.sent();
                            throw new common_1.HttpException({
                                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                                message: "Failed to update assignment: ".concat(error_4.message || 'Unknown error'),
                                error: error_4.message || 'Internal server error',
                            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.updateQuiz = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.updateQuiz(courseId, id, updates)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_5 = _a.sent();
                            throw new common_1.HttpException({
                                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                                message: "Failed to update quiz ".concat(id, ": ").concat(error_5.message || 'Unknown error'),
                                error: error_5.message || 'Internal server error',
                            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.updateDiscussion = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.updateDiscussion(courseId, id, updates)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_6 = _a.sent();
                            throw new common_1.HttpException({
                                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                                message: "Failed to update discussion ".concat(id, ": ").concat((error_6 === null || error_6 === void 0 ? void 0 : error_6.message) || 'Unknown error'),
                                error: (error_6 === null || error_6 === void 0 ? void 0 : error_6.message) || 'Internal server error',
                            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.updatePage = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.updatePage(courseId, id, updates)];
                });
            });
        };
        CanvasController_1.prototype.updateAnnouncement = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.canvasService.updateAnnouncement(courseId, id, updates)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_7 = _a.sent();
                            throw new common_1.HttpException({
                                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                                message: "Failed to update announcement ".concat(id, ": ").concat((error_7 === null || error_7 === void 0 ? void 0 : error_7.message) || 'Unknown error'),
                                error: (error_7 === null || error_7 === void 0 ? void 0 : error_7.message) || 'Internal server error',
                            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasController_1.prototype.updateModule = function (courseId, id, updates) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.updateModule(courseId, id, updates)];
                });
            });
        };
        // Bulk update endpoints (kept for future use)
        CanvasController_1.prototype.bulkUpdateAssignments = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.bulkUpdateAssignments(courseId, body.itemIds, body.updates)];
                });
            });
        };
        CanvasController_1.prototype.bulkUpdateQuizzes = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.bulkUpdateQuizzes(courseId, body.itemIds, body.updates)];
                });
            });
        };
        CanvasController_1.prototype.bulkUpdateDiscussions = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.bulkUpdateDiscussions(courseId, body.itemIds, body.updates)];
                });
            });
        };
        CanvasController_1.prototype.bulkUpdatePages = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.bulkUpdatePages(courseId, body.itemIds, body.updates)];
                });
            });
        };
        CanvasController_1.prototype.bulkUpdateAnnouncements = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.bulkUpdateAnnouncements(courseId, body.itemIds, body.updates)];
                });
            });
        };
        CanvasController_1.prototype.bulkUpdateModules = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.bulkUpdateModules(courseId, body.itemIds, body.updates)];
                });
            });
        };
        // Delete endpoints
        CanvasController_1.prototype.deleteAssignment = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteAssignment(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.deleteQuiz = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteQuiz(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.deleteDiscussion = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteDiscussion(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.deletePage = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deletePage(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.deleteModule = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteModule(courseId, id)];
                });
            });
        };
        CanvasController_1.prototype.deleteAnnouncement = function (courseId, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteAnnouncement(courseId, id)];
                });
            });
        };
        // Content Export endpoint
        CanvasController_1.prototype.createContentExport = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createContentExport(courseId, body.export_type || 'common_cartridge')];
                });
            });
        };
        // Create endpoints (for duplication)
        CanvasController_1.prototype.createAssignment = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createAssignment(courseId, body)];
                });
            });
        };
        CanvasController_1.prototype.createQuiz = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createQuiz(courseId, body)];
                });
            });
        };
        CanvasController_1.prototype.createDiscussion = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createDiscussion(courseId, body)];
                });
            });
        };
        CanvasController_1.prototype.createPage = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createPage(courseId, body)];
                });
            });
        };
        CanvasController_1.prototype.createAnnouncement = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createAnnouncement(courseId, body)];
                });
            });
        };
        CanvasController_1.prototype.createModule = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createModule(courseId, body)];
                });
            });
        };
        CanvasController_1.prototype.createNewQuiz = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createNewQuiz(courseId, body)];
                });
            });
        };
        CanvasController_1.prototype.createQuizExtensions = function (courseId, quizId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createQuizExtensions(courseId, quizId, body.quiz_extensions)];
                });
            });
        };
        CanvasController_1.prototype.getAssignmentOverrides = function (courseId, assignmentId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getAssignmentOverrides(courseId, assignmentId)];
                });
            });
        };
        CanvasController_1.prototype.deleteAssignmentOverride = function (courseId, assignmentId, overrideId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteAssignmentOverride(courseId, assignmentId, overrideId)];
                });
            });
        };
        CanvasController_1.prototype.createAssignmentOverride = function (courseId, assignmentId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createAssignmentOverride(courseId, assignmentId, body.assignment_override)];
                });
            });
        };
        CanvasController_1.prototype.createModuleItem = function (courseId, moduleId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.createModuleItem(courseId, moduleId, body)];
                });
            });
        };
        CanvasController_1.prototype.getModuleItems = function (courseId, moduleId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.getModuleItems(courseId, moduleId)];
                });
            });
        };
        CanvasController_1.prototype.deleteModuleItem = function (courseId, moduleId, itemId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.canvasService.deleteModuleItem(courseId, {
                            type: body.type,
                            content_id: body.content_id,
                        })];
                });
            });
        };
        CanvasController_1.prototype.bulkDeleteFiles = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (Array.isArray(body === null || body === void 0 ? void 0 : body.isFolders) && body.isFolders.some(Boolean)) {
                        throw new common_1.HttpException('Folders must be deleted directly in Canvas', common_1.HttpStatus.BAD_REQUEST);
                    }
                    return [2 /*return*/, this.canvasService.bulkDeleteFiles(courseId, body.fileIds, body.isFolders || [])];
                });
            });
        };
        CanvasController_1.prototype.copyFile = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!(body === null || body === void 0 ? void 0 : body.source_file_id)) {
                        throw new common_1.HttpException('source_file_id required', common_1.HttpStatus.BAD_REQUEST);
                    }
                    return [2 /*return*/, this.canvasService.copyFileToFolder(courseId, Number(body.source_file_id), body.parent_folder_id != null ? Number(body.parent_folder_id) : null, body.display_name)];
                });
            });
        };
        CanvasController_1.prototype.createFolder = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!(body === null || body === void 0 ? void 0 : body.name))
                        throw new common_1.HttpException('name required', common_1.HttpStatus.BAD_REQUEST);
                    return [2 /*return*/, this.canvasService.createFolder(courseId, body.name, body.parent_folder_id)];
                });
            });
        };
        CanvasController_1.prototype.copyFolder = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!(body === null || body === void 0 ? void 0 : body.source_folder_id)) {
                        throw new common_1.HttpException('source_folder_id required', common_1.HttpStatus.BAD_REQUEST);
                    }
                    return [2 /*return*/, this.canvasService.copyFolderToFolder(courseId, Number(body.source_folder_id), body.parent_folder_id != null ? Number(body.parent_folder_id) : null, body.name)];
                });
            });
        };
        CanvasController_1.prototype.deleteFileOrFolder = function (courseId, fileId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var results, r;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (body === null || body === void 0 ? void 0 : body.isFolder) {
                                throw new common_1.HttpException('Folders must be deleted directly in Canvas', common_1.HttpStatus.BAD_REQUEST);
                            }
                            return [4 /*yield*/, this.canvasService.bulkDeleteFiles(courseId, [fileId], [!!(body === null || body === void 0 ? void 0 : body.isFolder)])];
                        case 1:
                            results = _a.sent();
                            r = results[0];
                            if (r && !r.success)
                                throw new common_1.HttpException(r.error || 'Delete failed', common_1.HttpStatus.BAD_REQUEST);
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        CanvasController_1.prototype.updateFileOrFolder = function (courseId, fileId, body) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (body.isFolder)
                        return [2 /*return*/, this.canvasService.updateFolder(fileId, body)];
                    return [2 /*return*/, this.canvasService.updateFile(courseId, fileId, body)];
                });
            });
        };
        return CanvasController_1;
    }());
    __setFunctionName(_classThis, "CanvasController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getCourses_decorators = [(0, common_1.Get)('courses')];
        _getCourseDetails_decorators = [(0, common_1.Get)('courses/:id')];
        _getCourseStudents_decorators = [(0, common_1.Get)('courses/:id/students')];
        _getCourseQuizzes_decorators = [(0, common_1.Get)('courses/:id/quizzes')];
        _getCourseAssignments_decorators = [(0, common_1.Get)('courses/:id/assignments')];
        _getCourseNewQuizzes_decorators = [(0, common_1.Get)('courses/:id/new_quizzes')];
        _getCourseAssignmentGroups_decorators = [(0, common_1.Get)('courses/:id/assignment_groups')];
        _getCourseRubrics_decorators = [(0, common_1.Get)('courses/:id/rubrics')];
        _createCourseRubric_decorators = [(0, common_1.Post)('courses/:id/rubrics')];
        _createAssignmentGroup_decorators = [(0, common_1.Post)('courses/:id/assignment_groups')];
        _updateAssignmentGroup_decorators = [(0, common_1.Put)('courses/:courseId/assignment_groups/:id')];
        _deleteAssignmentGroup_decorators = [(0, common_1.Delete)('courses/:courseId/assignment_groups/:id')];
        _getCourseDiscussions_decorators = [(0, common_1.Get)('courses/:id/discussions')];
        _getCoursePages_decorators = [(0, common_1.Get)('courses/:id/pages')];
        _getCourseAnnouncements_decorators = [(0, common_1.Get)('courses/:id/announcements')];
        _getCourseModules_decorators = [(0, common_1.Get)('courses/:id/modules')];
        _getCourseFiles_decorators = [(0, common_1.Get)('courses/:id/files')];
        _getCourseAccommodations_decorators = [(0, common_1.Get)('courses/:id/accommodations')];
        _ensureAccommodationColumns_decorators = [(0, common_1.Get)('courses/:id/accommodations/ensure-columns')];
        _getAccommodationData_decorators = [(0, common_1.Get)('courses/:id/accommodations/data')];
        _saveAccommodationValue_decorators = [(0, common_1.Put)('courses/:courseId/accommodations/columns/:columnId/users/:userId')];
        _getCustomGradebookColumns_decorators = [(0, common_1.Get)('courses/:id/custom_gradebook_columns')];
        _getAccreditationProfile_decorators = [(0, common_1.Get)('courses/:id/accreditation/profile')];
        _saveAccreditationProfile_decorators = [(0, common_1.Put)('courses/:id/accreditation/profile')];
        _getAccreditors_decorators = [(0, common_1.Get)('courses/:id/accreditation/accreditors')];
        _suggestStandards_decorators = [(0, common_1.Post)('courses/:id/accreditation/standards/suggest')];
        _finalizeStandards_decorators = [(0, common_1.Post)('courses/:id/accreditation/standards/finalize')];
        _applyAiSuggestionAction_decorators = [(0, common_1.Post)('courses/:id/accreditation/standards/ai-action')];
        _getAccreditationStandards_decorators = [(0, common_1.Get)('courses/:id/accreditation/standards')];
        _getCourseOutcomeLinks_decorators = [(0, common_1.Get)('courses/:id/accreditation/outcomes')];
        _getOutcomesPreview_decorators = [(0, common_1.Get)('courses/:id/accreditation/outcomes/preview')];
        _syncOutcomesForOrg_decorators = [(0, common_1.Post)('courses/:id/accreditation/outcomes/sync-org')];
        _syncCourseOutcomesFromStandards_decorators = [(0, common_1.Post)('courses/:id/accreditation/outcomes/sync')];
        _getAccreditationWorkflow_decorators = [(0, common_1.Get)('courses/:id/accreditation/workflow')];
        _getInstructionAlignment_decorators = [(0, common_1.Get)('courses/:id/accreditation/instruction-alignment')];
        _createRubricForResource_decorators = [(0, common_1.Post)('courses/:id/accreditation/rubrics/create')];
        _applyResourceTagging_decorators = [(0, common_1.Post)('courses/:id/accreditation/tagging/resource')];
        _applyQuizTagging_decorators = [(0, common_1.Post)('courses/:id/accreditation/tagging/quiz')];
        _applyNewQuizTagging_decorators = [(0, common_1.Post)('courses/:id/accreditation/tagging/new-quiz')];
        _getAccreditationAlignment_decorators = [(0, common_1.Get)('courses/:id/accreditation/alignment')];
        _getAccessibilityScan_decorators = [(0, common_1.Get)('courses/:id/accessibility/scan')];
        _getAccessibilityFixPreview_decorators = [(0, common_1.Post)('courses/:id/accessibility/fix-preview')];
        _getAccessibilityFixPreviewItem_decorators = [(0, common_1.Post)('courses/:id/accessibility/fix-preview-item')];
        _applyAccessibilityFixes_decorators = [(0, common_1.Post)('courses/:id/accessibility/fix-apply')];
        _exportAccessibilityCsv_decorators = [(0, common_1.Get)('courses/:id/accessibility/export.csv'), (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'), (0, common_1.Header)('Content-Disposition', 'attachment; filename="accessibility_report.csv"')];
        _updateOutcomeStandards_decorators = [(0, common_1.Put)('outcomes/:outcomeId/standards')];
        _getBulkUserTags_decorators = [(0, common_1.Get)('courses/:id/bulk_user_tags')];
        _getAssignment_decorators = [(0, common_1.Get)('courses/:courseId/assignments/:id')];
        _getQuiz_decorators = [(0, common_1.Get)('courses/:courseId/quizzes/:id')];
        _getDiscussion_decorators = [(0, common_1.Get)('courses/:courseId/discussions/:id')];
        _getPage_decorators = [(0, common_1.Get)('courses/:courseId/pages/:id')];
        _getAnnouncement_decorators = [(0, common_1.Get)('courses/:courseId/announcements/:id')];
        _getModule_decorators = [(0, common_1.Get)('courses/:courseId/modules/:id')];
        _updateNewQuiz_decorators = [(0, common_1.Put)('courses/:courseId/new_quizzes/:id')];
        _updateAssignment_decorators = [(0, common_1.Put)('courses/:courseId/assignments/:id')];
        _updateQuiz_decorators = [(0, common_1.Put)('courses/:courseId/quizzes/:id')];
        _updateDiscussion_decorators = [(0, common_1.Put)('courses/:courseId/discussions/:id')];
        _updatePage_decorators = [(0, common_1.Put)('courses/:courseId/pages/:id')];
        _updateAnnouncement_decorators = [(0, common_1.Put)('courses/:courseId/announcements/:id')];
        _updateModule_decorators = [(0, common_1.Put)('courses/:courseId/modules/:id')];
        _bulkUpdateAssignments_decorators = [(0, common_1.Put)('courses/:courseId/assignments/_bulk/update')];
        _bulkUpdateQuizzes_decorators = [(0, common_1.Put)('courses/:courseId/quizzes/_bulk/update')];
        _bulkUpdateDiscussions_decorators = [(0, common_1.Put)('courses/:courseId/discussions/_bulk/update')];
        _bulkUpdatePages_decorators = [(0, common_1.Put)('courses/:courseId/pages/_bulk/update')];
        _bulkUpdateAnnouncements_decorators = [(0, common_1.Put)('courses/:courseId/announcements/_bulk/update')];
        _bulkUpdateModules_decorators = [(0, common_1.Put)('courses/:courseId/modules/_bulk/update')];
        _deleteAssignment_decorators = [(0, common_1.Delete)('courses/:courseId/assignments/:id')];
        _deleteQuiz_decorators = [(0, common_1.Delete)('courses/:courseId/quizzes/:id')];
        _deleteDiscussion_decorators = [(0, common_1.Delete)('courses/:courseId/discussions/:id')];
        _deletePage_decorators = [(0, common_1.Delete)('courses/:courseId/pages/:id')];
        _deleteModule_decorators = [(0, common_1.Delete)('courses/:courseId/modules/:id')];
        _deleteAnnouncement_decorators = [(0, common_1.Delete)('courses/:courseId/announcements/:id')];
        _createContentExport_decorators = [(0, common_1.Post)('courses/:courseId/content_exports')];
        _createAssignment_decorators = [(0, common_1.Post)('courses/:courseId/assignments')];
        _createQuiz_decorators = [(0, common_1.Post)('courses/:courseId/quizzes')];
        _createDiscussion_decorators = [(0, common_1.Post)('courses/:courseId/discussions')];
        _createPage_decorators = [(0, common_1.Post)('courses/:courseId/pages')];
        _createAnnouncement_decorators = [(0, common_1.Post)('courses/:courseId/announcements')];
        _createModule_decorators = [(0, common_1.Post)('courses/:courseId/modules')];
        _createNewQuiz_decorators = [(0, common_1.Post)('courses/:courseId/new_quizzes')];
        _createQuizExtensions_decorators = [(0, common_1.Post)('courses/:courseId/quizzes/:quizId/extensions')];
        _getAssignmentOverrides_decorators = [(0, common_1.Get)('courses/:courseId/assignments/:assignmentId/overrides')];
        _deleteAssignmentOverride_decorators = [(0, common_1.Delete)('courses/:courseId/assignments/:assignmentId/overrides/:overrideId')];
        _createAssignmentOverride_decorators = [(0, common_1.Post)('courses/:courseId/assignments/:assignmentId/overrides')];
        _createModuleItem_decorators = [(0, common_1.Post)('courses/:courseId/modules/:moduleId/items')];
        _getModuleItems_decorators = [(0, common_1.Get)('courses/:courseId/modules/:moduleId/items')];
        _deleteModuleItem_decorators = [(0, common_1.Delete)('courses/:courseId/modules/:moduleId/items/:itemId')];
        _bulkDeleteFiles_decorators = [(0, common_1.Delete)('courses/:id/files/bulk')];
        _copyFile_decorators = [(0, common_1.Post)('courses/:courseId/files/copy')];
        _createFolder_decorators = [(0, common_1.Post)('courses/:courseId/folders')];
        _copyFolder_decorators = [(0, common_1.Post)('courses/:courseId/folders/copy')];
        _deleteFileOrFolder_decorators = [(0, common_1.Delete)('courses/:courseId/files/:fileId')];
        _updateFileOrFolder_decorators = [(0, common_1.Put)('courses/:id/files/:fileId')];
        __esDecorate(_classThis, null, _getCourses_decorators, { kind: "method", name: "getCourses", static: false, private: false, access: { has: function (obj) { return "getCourses" in obj; }, get: function (obj) { return obj.getCourses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseDetails_decorators, { kind: "method", name: "getCourseDetails", static: false, private: false, access: { has: function (obj) { return "getCourseDetails" in obj; }, get: function (obj) { return obj.getCourseDetails; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseStudents_decorators, { kind: "method", name: "getCourseStudents", static: false, private: false, access: { has: function (obj) { return "getCourseStudents" in obj; }, get: function (obj) { return obj.getCourseStudents; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseQuizzes_decorators, { kind: "method", name: "getCourseQuizzes", static: false, private: false, access: { has: function (obj) { return "getCourseQuizzes" in obj; }, get: function (obj) { return obj.getCourseQuizzes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseAssignments_decorators, { kind: "method", name: "getCourseAssignments", static: false, private: false, access: { has: function (obj) { return "getCourseAssignments" in obj; }, get: function (obj) { return obj.getCourseAssignments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseNewQuizzes_decorators, { kind: "method", name: "getCourseNewQuizzes", static: false, private: false, access: { has: function (obj) { return "getCourseNewQuizzes" in obj; }, get: function (obj) { return obj.getCourseNewQuizzes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseAssignmentGroups_decorators, { kind: "method", name: "getCourseAssignmentGroups", static: false, private: false, access: { has: function (obj) { return "getCourseAssignmentGroups" in obj; }, get: function (obj) { return obj.getCourseAssignmentGroups; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseRubrics_decorators, { kind: "method", name: "getCourseRubrics", static: false, private: false, access: { has: function (obj) { return "getCourseRubrics" in obj; }, get: function (obj) { return obj.getCourseRubrics; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createCourseRubric_decorators, { kind: "method", name: "createCourseRubric", static: false, private: false, access: { has: function (obj) { return "createCourseRubric" in obj; }, get: function (obj) { return obj.createCourseRubric; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAssignmentGroup_decorators, { kind: "method", name: "createAssignmentGroup", static: false, private: false, access: { has: function (obj) { return "createAssignmentGroup" in obj; }, get: function (obj) { return obj.createAssignmentGroup; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAssignmentGroup_decorators, { kind: "method", name: "updateAssignmentGroup", static: false, private: false, access: { has: function (obj) { return "updateAssignmentGroup" in obj; }, get: function (obj) { return obj.updateAssignmentGroup; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAssignmentGroup_decorators, { kind: "method", name: "deleteAssignmentGroup", static: false, private: false, access: { has: function (obj) { return "deleteAssignmentGroup" in obj; }, get: function (obj) { return obj.deleteAssignmentGroup; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseDiscussions_decorators, { kind: "method", name: "getCourseDiscussions", static: false, private: false, access: { has: function (obj) { return "getCourseDiscussions" in obj; }, get: function (obj) { return obj.getCourseDiscussions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCoursePages_decorators, { kind: "method", name: "getCoursePages", static: false, private: false, access: { has: function (obj) { return "getCoursePages" in obj; }, get: function (obj) { return obj.getCoursePages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseAnnouncements_decorators, { kind: "method", name: "getCourseAnnouncements", static: false, private: false, access: { has: function (obj) { return "getCourseAnnouncements" in obj; }, get: function (obj) { return obj.getCourseAnnouncements; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseModules_decorators, { kind: "method", name: "getCourseModules", static: false, private: false, access: { has: function (obj) { return "getCourseModules" in obj; }, get: function (obj) { return obj.getCourseModules; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseFiles_decorators, { kind: "method", name: "getCourseFiles", static: false, private: false, access: { has: function (obj) { return "getCourseFiles" in obj; }, get: function (obj) { return obj.getCourseFiles; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseAccommodations_decorators, { kind: "method", name: "getCourseAccommodations", static: false, private: false, access: { has: function (obj) { return "getCourseAccommodations" in obj; }, get: function (obj) { return obj.getCourseAccommodations; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _ensureAccommodationColumns_decorators, { kind: "method", name: "ensureAccommodationColumns", static: false, private: false, access: { has: function (obj) { return "ensureAccommodationColumns" in obj; }, get: function (obj) { return obj.ensureAccommodationColumns; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccommodationData_decorators, { kind: "method", name: "getAccommodationData", static: false, private: false, access: { has: function (obj) { return "getAccommodationData" in obj; }, get: function (obj) { return obj.getAccommodationData; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _saveAccommodationValue_decorators, { kind: "method", name: "saveAccommodationValue", static: false, private: false, access: { has: function (obj) { return "saveAccommodationValue" in obj; }, get: function (obj) { return obj.saveAccommodationValue; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCustomGradebookColumns_decorators, { kind: "method", name: "getCustomGradebookColumns", static: false, private: false, access: { has: function (obj) { return "getCustomGradebookColumns" in obj; }, get: function (obj) { return obj.getCustomGradebookColumns; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccreditationProfile_decorators, { kind: "method", name: "getAccreditationProfile", static: false, private: false, access: { has: function (obj) { return "getAccreditationProfile" in obj; }, get: function (obj) { return obj.getAccreditationProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _saveAccreditationProfile_decorators, { kind: "method", name: "saveAccreditationProfile", static: false, private: false, access: { has: function (obj) { return "saveAccreditationProfile" in obj; }, get: function (obj) { return obj.saveAccreditationProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccreditors_decorators, { kind: "method", name: "getAccreditors", static: false, private: false, access: { has: function (obj) { return "getAccreditors" in obj; }, get: function (obj) { return obj.getAccreditors; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _suggestStandards_decorators, { kind: "method", name: "suggestStandards", static: false, private: false, access: { has: function (obj) { return "suggestStandards" in obj; }, get: function (obj) { return obj.suggestStandards; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _finalizeStandards_decorators, { kind: "method", name: "finalizeStandards", static: false, private: false, access: { has: function (obj) { return "finalizeStandards" in obj; }, get: function (obj) { return obj.finalizeStandards; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyAiSuggestionAction_decorators, { kind: "method", name: "applyAiSuggestionAction", static: false, private: false, access: { has: function (obj) { return "applyAiSuggestionAction" in obj; }, get: function (obj) { return obj.applyAiSuggestionAction; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccreditationStandards_decorators, { kind: "method", name: "getAccreditationStandards", static: false, private: false, access: { has: function (obj) { return "getAccreditationStandards" in obj; }, get: function (obj) { return obj.getAccreditationStandards; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCourseOutcomeLinks_decorators, { kind: "method", name: "getCourseOutcomeLinks", static: false, private: false, access: { has: function (obj) { return "getCourseOutcomeLinks" in obj; }, get: function (obj) { return obj.getCourseOutcomeLinks; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOutcomesPreview_decorators, { kind: "method", name: "getOutcomesPreview", static: false, private: false, access: { has: function (obj) { return "getOutcomesPreview" in obj; }, get: function (obj) { return obj.getOutcomesPreview; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncOutcomesForOrg_decorators, { kind: "method", name: "syncOutcomesForOrg", static: false, private: false, access: { has: function (obj) { return "syncOutcomesForOrg" in obj; }, get: function (obj) { return obj.syncOutcomesForOrg; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncCourseOutcomesFromStandards_decorators, { kind: "method", name: "syncCourseOutcomesFromStandards", static: false, private: false, access: { has: function (obj) { return "syncCourseOutcomesFromStandards" in obj; }, get: function (obj) { return obj.syncCourseOutcomesFromStandards; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccreditationWorkflow_decorators, { kind: "method", name: "getAccreditationWorkflow", static: false, private: false, access: { has: function (obj) { return "getAccreditationWorkflow" in obj; }, get: function (obj) { return obj.getAccreditationWorkflow; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getInstructionAlignment_decorators, { kind: "method", name: "getInstructionAlignment", static: false, private: false, access: { has: function (obj) { return "getInstructionAlignment" in obj; }, get: function (obj) { return obj.getInstructionAlignment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createRubricForResource_decorators, { kind: "method", name: "createRubricForResource", static: false, private: false, access: { has: function (obj) { return "createRubricForResource" in obj; }, get: function (obj) { return obj.createRubricForResource; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyResourceTagging_decorators, { kind: "method", name: "applyResourceTagging", static: false, private: false, access: { has: function (obj) { return "applyResourceTagging" in obj; }, get: function (obj) { return obj.applyResourceTagging; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyQuizTagging_decorators, { kind: "method", name: "applyQuizTagging", static: false, private: false, access: { has: function (obj) { return "applyQuizTagging" in obj; }, get: function (obj) { return obj.applyQuizTagging; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyNewQuizTagging_decorators, { kind: "method", name: "applyNewQuizTagging", static: false, private: false, access: { has: function (obj) { return "applyNewQuizTagging" in obj; }, get: function (obj) { return obj.applyNewQuizTagging; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccreditationAlignment_decorators, { kind: "method", name: "getAccreditationAlignment", static: false, private: false, access: { has: function (obj) { return "getAccreditationAlignment" in obj; }, get: function (obj) { return obj.getAccreditationAlignment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccessibilityScan_decorators, { kind: "method", name: "getAccessibilityScan", static: false, private: false, access: { has: function (obj) { return "getAccessibilityScan" in obj; }, get: function (obj) { return obj.getAccessibilityScan; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccessibilityFixPreview_decorators, { kind: "method", name: "getAccessibilityFixPreview", static: false, private: false, access: { has: function (obj) { return "getAccessibilityFixPreview" in obj; }, get: function (obj) { return obj.getAccessibilityFixPreview; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccessibilityFixPreviewItem_decorators, { kind: "method", name: "getAccessibilityFixPreviewItem", static: false, private: false, access: { has: function (obj) { return "getAccessibilityFixPreviewItem" in obj; }, get: function (obj) { return obj.getAccessibilityFixPreviewItem; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyAccessibilityFixes_decorators, { kind: "method", name: "applyAccessibilityFixes", static: false, private: false, access: { has: function (obj) { return "applyAccessibilityFixes" in obj; }, get: function (obj) { return obj.applyAccessibilityFixes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportAccessibilityCsv_decorators, { kind: "method", name: "exportAccessibilityCsv", static: false, private: false, access: { has: function (obj) { return "exportAccessibilityCsv" in obj; }, get: function (obj) { return obj.exportAccessibilityCsv; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateOutcomeStandards_decorators, { kind: "method", name: "updateOutcomeStandards", static: false, private: false, access: { has: function (obj) { return "updateOutcomeStandards" in obj; }, get: function (obj) { return obj.updateOutcomeStandards; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBulkUserTags_decorators, { kind: "method", name: "getBulkUserTags", static: false, private: false, access: { has: function (obj) { return "getBulkUserTags" in obj; }, get: function (obj) { return obj.getBulkUserTags; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAssignment_decorators, { kind: "method", name: "getAssignment", static: false, private: false, access: { has: function (obj) { return "getAssignment" in obj; }, get: function (obj) { return obj.getAssignment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getQuiz_decorators, { kind: "method", name: "getQuiz", static: false, private: false, access: { has: function (obj) { return "getQuiz" in obj; }, get: function (obj) { return obj.getQuiz; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDiscussion_decorators, { kind: "method", name: "getDiscussion", static: false, private: false, access: { has: function (obj) { return "getDiscussion" in obj; }, get: function (obj) { return obj.getDiscussion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPage_decorators, { kind: "method", name: "getPage", static: false, private: false, access: { has: function (obj) { return "getPage" in obj; }, get: function (obj) { return obj.getPage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnnouncement_decorators, { kind: "method", name: "getAnnouncement", static: false, private: false, access: { has: function (obj) { return "getAnnouncement" in obj; }, get: function (obj) { return obj.getAnnouncement; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getModule_decorators, { kind: "method", name: "getModule", static: false, private: false, access: { has: function (obj) { return "getModule" in obj; }, get: function (obj) { return obj.getModule; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateNewQuiz_decorators, { kind: "method", name: "updateNewQuiz", static: false, private: false, access: { has: function (obj) { return "updateNewQuiz" in obj; }, get: function (obj) { return obj.updateNewQuiz; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAssignment_decorators, { kind: "method", name: "updateAssignment", static: false, private: false, access: { has: function (obj) { return "updateAssignment" in obj; }, get: function (obj) { return obj.updateAssignment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateQuiz_decorators, { kind: "method", name: "updateQuiz", static: false, private: false, access: { has: function (obj) { return "updateQuiz" in obj; }, get: function (obj) { return obj.updateQuiz; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateDiscussion_decorators, { kind: "method", name: "updateDiscussion", static: false, private: false, access: { has: function (obj) { return "updateDiscussion" in obj; }, get: function (obj) { return obj.updateDiscussion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updatePage_decorators, { kind: "method", name: "updatePage", static: false, private: false, access: { has: function (obj) { return "updatePage" in obj; }, get: function (obj) { return obj.updatePage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAnnouncement_decorators, { kind: "method", name: "updateAnnouncement", static: false, private: false, access: { has: function (obj) { return "updateAnnouncement" in obj; }, get: function (obj) { return obj.updateAnnouncement; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateModule_decorators, { kind: "method", name: "updateModule", static: false, private: false, access: { has: function (obj) { return "updateModule" in obj; }, get: function (obj) { return obj.updateModule; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkUpdateAssignments_decorators, { kind: "method", name: "bulkUpdateAssignments", static: false, private: false, access: { has: function (obj) { return "bulkUpdateAssignments" in obj; }, get: function (obj) { return obj.bulkUpdateAssignments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkUpdateQuizzes_decorators, { kind: "method", name: "bulkUpdateQuizzes", static: false, private: false, access: { has: function (obj) { return "bulkUpdateQuizzes" in obj; }, get: function (obj) { return obj.bulkUpdateQuizzes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkUpdateDiscussions_decorators, { kind: "method", name: "bulkUpdateDiscussions", static: false, private: false, access: { has: function (obj) { return "bulkUpdateDiscussions" in obj; }, get: function (obj) { return obj.bulkUpdateDiscussions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkUpdatePages_decorators, { kind: "method", name: "bulkUpdatePages", static: false, private: false, access: { has: function (obj) { return "bulkUpdatePages" in obj; }, get: function (obj) { return obj.bulkUpdatePages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkUpdateAnnouncements_decorators, { kind: "method", name: "bulkUpdateAnnouncements", static: false, private: false, access: { has: function (obj) { return "bulkUpdateAnnouncements" in obj; }, get: function (obj) { return obj.bulkUpdateAnnouncements; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkUpdateModules_decorators, { kind: "method", name: "bulkUpdateModules", static: false, private: false, access: { has: function (obj) { return "bulkUpdateModules" in obj; }, get: function (obj) { return obj.bulkUpdateModules; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAssignment_decorators, { kind: "method", name: "deleteAssignment", static: false, private: false, access: { has: function (obj) { return "deleteAssignment" in obj; }, get: function (obj) { return obj.deleteAssignment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteQuiz_decorators, { kind: "method", name: "deleteQuiz", static: false, private: false, access: { has: function (obj) { return "deleteQuiz" in obj; }, get: function (obj) { return obj.deleteQuiz; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteDiscussion_decorators, { kind: "method", name: "deleteDiscussion", static: false, private: false, access: { has: function (obj) { return "deleteDiscussion" in obj; }, get: function (obj) { return obj.deleteDiscussion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deletePage_decorators, { kind: "method", name: "deletePage", static: false, private: false, access: { has: function (obj) { return "deletePage" in obj; }, get: function (obj) { return obj.deletePage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteModule_decorators, { kind: "method", name: "deleteModule", static: false, private: false, access: { has: function (obj) { return "deleteModule" in obj; }, get: function (obj) { return obj.deleteModule; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAnnouncement_decorators, { kind: "method", name: "deleteAnnouncement", static: false, private: false, access: { has: function (obj) { return "deleteAnnouncement" in obj; }, get: function (obj) { return obj.deleteAnnouncement; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createContentExport_decorators, { kind: "method", name: "createContentExport", static: false, private: false, access: { has: function (obj) { return "createContentExport" in obj; }, get: function (obj) { return obj.createContentExport; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAssignment_decorators, { kind: "method", name: "createAssignment", static: false, private: false, access: { has: function (obj) { return "createAssignment" in obj; }, get: function (obj) { return obj.createAssignment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createQuiz_decorators, { kind: "method", name: "createQuiz", static: false, private: false, access: { has: function (obj) { return "createQuiz" in obj; }, get: function (obj) { return obj.createQuiz; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createDiscussion_decorators, { kind: "method", name: "createDiscussion", static: false, private: false, access: { has: function (obj) { return "createDiscussion" in obj; }, get: function (obj) { return obj.createDiscussion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createPage_decorators, { kind: "method", name: "createPage", static: false, private: false, access: { has: function (obj) { return "createPage" in obj; }, get: function (obj) { return obj.createPage; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAnnouncement_decorators, { kind: "method", name: "createAnnouncement", static: false, private: false, access: { has: function (obj) { return "createAnnouncement" in obj; }, get: function (obj) { return obj.createAnnouncement; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createModule_decorators, { kind: "method", name: "createModule", static: false, private: false, access: { has: function (obj) { return "createModule" in obj; }, get: function (obj) { return obj.createModule; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createNewQuiz_decorators, { kind: "method", name: "createNewQuiz", static: false, private: false, access: { has: function (obj) { return "createNewQuiz" in obj; }, get: function (obj) { return obj.createNewQuiz; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createQuizExtensions_decorators, { kind: "method", name: "createQuizExtensions", static: false, private: false, access: { has: function (obj) { return "createQuizExtensions" in obj; }, get: function (obj) { return obj.createQuizExtensions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAssignmentOverrides_decorators, { kind: "method", name: "getAssignmentOverrides", static: false, private: false, access: { has: function (obj) { return "getAssignmentOverrides" in obj; }, get: function (obj) { return obj.getAssignmentOverrides; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAssignmentOverride_decorators, { kind: "method", name: "deleteAssignmentOverride", static: false, private: false, access: { has: function (obj) { return "deleteAssignmentOverride" in obj; }, get: function (obj) { return obj.deleteAssignmentOverride; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAssignmentOverride_decorators, { kind: "method", name: "createAssignmentOverride", static: false, private: false, access: { has: function (obj) { return "createAssignmentOverride" in obj; }, get: function (obj) { return obj.createAssignmentOverride; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createModuleItem_decorators, { kind: "method", name: "createModuleItem", static: false, private: false, access: { has: function (obj) { return "createModuleItem" in obj; }, get: function (obj) { return obj.createModuleItem; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getModuleItems_decorators, { kind: "method", name: "getModuleItems", static: false, private: false, access: { has: function (obj) { return "getModuleItems" in obj; }, get: function (obj) { return obj.getModuleItems; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteModuleItem_decorators, { kind: "method", name: "deleteModuleItem", static: false, private: false, access: { has: function (obj) { return "deleteModuleItem" in obj; }, get: function (obj) { return obj.deleteModuleItem; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkDeleteFiles_decorators, { kind: "method", name: "bulkDeleteFiles", static: false, private: false, access: { has: function (obj) { return "bulkDeleteFiles" in obj; }, get: function (obj) { return obj.bulkDeleteFiles; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _copyFile_decorators, { kind: "method", name: "copyFile", static: false, private: false, access: { has: function (obj) { return "copyFile" in obj; }, get: function (obj) { return obj.copyFile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createFolder_decorators, { kind: "method", name: "createFolder", static: false, private: false, access: { has: function (obj) { return "createFolder" in obj; }, get: function (obj) { return obj.createFolder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _copyFolder_decorators, { kind: "method", name: "copyFolder", static: false, private: false, access: { has: function (obj) { return "copyFolder" in obj; }, get: function (obj) { return obj.copyFolder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteFileOrFolder_decorators, { kind: "method", name: "deleteFileOrFolder", static: false, private: false, access: { has: function (obj) { return "deleteFileOrFolder" in obj; }, get: function (obj) { return obj.deleteFileOrFolder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateFileOrFolder_decorators, { kind: "method", name: "updateFileOrFolder", static: false, private: false, access: { has: function (obj) { return "updateFileOrFolder" in obj; }, get: function (obj) { return obj.updateFileOrFolder; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CanvasController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CanvasController = _classThis;
}();
exports.CanvasController = CanvasController;

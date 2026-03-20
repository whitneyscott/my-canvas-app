"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasController = void 0;
var common_1 = require("@nestjs/common");
var canvas_service_1 = require("./canvas.service");
var CanvasController = /** @class */ (function () {
    function CanvasController(canvasService) {
        this.canvasService = canvasService;
    }
    CanvasController.prototype.getCourses = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourses()];
            });
        });
    };
    CanvasController.prototype.getCourseDetails = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseDetails(id)];
            });
        });
    };
    CanvasController.prototype.getCourseStudents = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseStudents(id)];
            });
        });
    };
    CanvasController.prototype.getCourseQuizzes = function (id) {
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
                            error: error_1.message || 'Internal server error'
                        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CanvasController.prototype.getCourseAssignments = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseAssignments(id)];
            });
        });
    };
    CanvasController.prototype.getCourseAssignmentGroups = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseAssignmentGroups(id)];
            });
        });
    };
    CanvasController.prototype.createAssignmentGroup = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createAssignmentGroup(courseId, body.name, body.group_weight)];
            });
        });
    };
    CanvasController.prototype.updateAssignmentGroup = function (courseId, id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.updateAssignmentGroup(courseId, id, updates)];
            });
        });
    };
    CanvasController.prototype.deleteAssignmentGroup = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteAssignmentGroup(courseId, id)];
            });
        });
    };
    CanvasController.prototype.getCourseDiscussions = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseDiscussions(id)];
            });
        });
    };
    CanvasController.prototype.getCoursePages = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCoursePages(id)];
            });
        });
    };
    CanvasController.prototype.getCourseAnnouncements = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseAnnouncements(id)];
            });
        });
    };
    CanvasController.prototype.getCourseModules = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseModules(id)];
            });
        });
    };
    CanvasController.prototype.getCourseFiles = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseFiles(id)];
            });
        });
    };
    CanvasController.prototype.getCourseAccommodations = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseAccommodations(id)];
            });
        });
    };
    CanvasController.prototype.ensureAccommodationColumns = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.ensureAccommodationColumns(id)];
            });
        });
    };
    CanvasController.prototype.getAccommodationData = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getAccommodationData(id)];
            });
        });
    };
    CanvasController.prototype.saveAccommodationValue = function (courseId, columnId, userId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.saveAccommodationValue(courseId, columnId, userId, body.content)];
            });
        });
    };
    CanvasController.prototype.getCustomGradebookColumns = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCustomGradebookColumns(id)];
            });
        });
    };
    CanvasController.prototype.getAccreditationProfile = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getAccreditationProfile(id)];
            });
        });
    };
    CanvasController.prototype.saveAccreditationProfile = function (id, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.saveAccreditationProfile(id, body.profile)];
            });
        });
    };
    CanvasController.prototype.getAccreditors = function (id, cip, degreeLevel) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getAccreditorsForCourse(id, cip || undefined, degreeLevel || undefined)];
            });
        });
    };
    CanvasController.prototype.getCourseOutcomeLinks = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getCourseOutcomeLinks(id)];
            });
        });
    };
    CanvasController.prototype.updateOutcomeStandards = function (outcomeId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, this.canvasService.updateOutcomeStandards(outcomeId, (_a = body.standards) !== null && _a !== void 0 ? _a : [])];
            });
        });
    };
    CanvasController.prototype.getBulkUserTags = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getBulkUserTags(id)];
            });
        });
    };
    // Individual GET endpoints (for fetching full item data)
    CanvasController.prototype.getAssignment = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getAssignment(courseId, id)];
            });
        });
    };
    CanvasController.prototype.getQuiz = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getQuiz(courseId, id)];
            });
        });
    };
    CanvasController.prototype.getDiscussion = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getDiscussion(courseId, id)];
            });
        });
    };
    CanvasController.prototype.getPage = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getPage(courseId, id)];
            });
        });
    };
    CanvasController.prototype.getAnnouncement = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getAnnouncement(courseId, id)];
            });
        });
    };
    CanvasController.prototype.getModule = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getModule(courseId, id)];
            });
        });
    };
    // Individual update endpoints (for inline editing)
    CanvasController.prototype.updateAssignment = function (courseId, id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("[Controller] Updating assignment ".concat(id, " in course ").concat(courseId));
                        console.log("[Controller] Updates received:", JSON.stringify(updates, null, 2));
                        return [4 /*yield*/, this.canvasService.updateAssignment(courseId, id, updates)];
                    case 1:
                        result = _a.sent();
                        console.log("[Controller] Assignment ".concat(id, " updated successfully"));
                        console.log("[Controller] Returning result to client:", JSON.stringify(result, null, 2));
                        return [2 /*return*/, result];
                    case 2:
                        error_2 = _a.sent();
                        console.error("[Controller] Error updating assignment ".concat(id, " in course ").concat(courseId, ":"), error_2);
                        console.error("[Controller] Error message:", error_2.message);
                        console.error("[Controller] Error stack:", error_2.stack);
                        throw new common_1.HttpException({
                            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                            message: "Failed to update assignment: ".concat(error_2.message || 'Unknown error'),
                            error: error_2.message || 'Internal server error'
                        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CanvasController.prototype.updateQuiz = function (courseId, id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("[Controller] Updating quiz ".concat(id, " in course ").concat(courseId));
                        console.log("[Controller] Updates received:", JSON.stringify(updates, null, 2));
                        return [4 /*yield*/, this.canvasService.updateQuiz(courseId, id, updates)];
                    case 1:
                        result = _a.sent();
                        console.log("[Controller] Quiz ".concat(id, " updated successfully"));
                        console.log("[Controller] Returning result to client:", JSON.stringify(result, null, 2));
                        return [2 /*return*/, result];
                    case 2:
                        error_3 = _a.sent();
                        console.error("[Controller] Error updating quiz ".concat(id, ":"), error_3);
                        console.error("[Controller] Error message:", error_3.message);
                        console.error("[Controller] Error stack:", error_3.stack);
                        // Throw HttpException so NestJS handles it properly
                        throw new common_1.HttpException({
                            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                            message: "Failed to update quiz ".concat(id, ": ").concat(error_3.message || 'Unknown error'),
                            error: error_3.message || 'Internal server error'
                        }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CanvasController.prototype.updateDiscussion = function (courseId, id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.updateDiscussion(courseId, id, updates)];
            });
        });
    };
    CanvasController.prototype.updatePage = function (courseId, id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.updatePage(courseId, id, updates)];
            });
        });
    };
    CanvasController.prototype.updateAnnouncement = function (courseId, id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.updateAnnouncement(courseId, id, updates)];
            });
        });
    };
    CanvasController.prototype.updateModule = function (courseId, id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.updateModule(courseId, id, updates)];
            });
        });
    };
    // Bulk update endpoints (kept for future use)
    CanvasController.prototype.bulkUpdateAssignments = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.bulkUpdateAssignments(courseId, body.itemIds, body.updates)];
            });
        });
    };
    CanvasController.prototype.bulkUpdateQuizzes = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.bulkUpdateQuizzes(courseId, body.itemIds, body.updates)];
            });
        });
    };
    CanvasController.prototype.bulkUpdateDiscussions = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.bulkUpdateDiscussions(courseId, body.itemIds, body.updates)];
            });
        });
    };
    CanvasController.prototype.bulkUpdatePages = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.bulkUpdatePages(courseId, body.itemIds, body.updates)];
            });
        });
    };
    CanvasController.prototype.bulkUpdateAnnouncements = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.bulkUpdateAnnouncements(courseId, body.itemIds, body.updates)];
            });
        });
    };
    CanvasController.prototype.bulkUpdateModules = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.bulkUpdateModules(courseId, body.itemIds, body.updates)];
            });
        });
    };
    // Delete endpoints
    CanvasController.prototype.deleteAssignment = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteAssignment(courseId, id)];
            });
        });
    };
    CanvasController.prototype.deleteQuiz = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteQuiz(courseId, id)];
            });
        });
    };
    CanvasController.prototype.deleteDiscussion = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteDiscussion(courseId, id)];
            });
        });
    };
    CanvasController.prototype.deletePage = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deletePage(courseId, id)];
            });
        });
    };
    CanvasController.prototype.deleteModule = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteModule(courseId, id)];
            });
        });
    };
    CanvasController.prototype.deleteAnnouncement = function (courseId, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteAnnouncement(courseId, id)];
            });
        });
    };
    // Content Export endpoint
    CanvasController.prototype.createContentExport = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createContentExport(courseId, body.export_type || 'common_cartridge')];
            });
        });
    };
    // Create endpoints (for duplication)
    CanvasController.prototype.createAssignment = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createAssignment(courseId, body)];
            });
        });
    };
    CanvasController.prototype.createQuiz = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createQuiz(courseId, body)];
            });
        });
    };
    CanvasController.prototype.createDiscussion = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createDiscussion(courseId, body)];
            });
        });
    };
    CanvasController.prototype.createPage = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createPage(courseId, body)];
            });
        });
    };
    CanvasController.prototype.createAnnouncement = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createAnnouncement(courseId, body)];
            });
        });
    };
    CanvasController.prototype.createModule = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createModule(courseId, body)];
            });
        });
    };
    CanvasController.prototype.createQuizExtensions = function (courseId, quizId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createQuizExtensions(courseId, quizId, body.quiz_extensions)];
            });
        });
    };
    CanvasController.prototype.getAssignmentOverrides = function (courseId, assignmentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getAssignmentOverrides(courseId, assignmentId)];
            });
        });
    };
    CanvasController.prototype.deleteAssignmentOverride = function (courseId, assignmentId, overrideId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteAssignmentOverride(courseId, assignmentId, overrideId)];
            });
        });
    };
    CanvasController.prototype.createAssignmentOverride = function (courseId, assignmentId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createAssignmentOverride(courseId, assignmentId, body.assignment_override)];
            });
        });
    };
    CanvasController.prototype.createModuleItem = function (courseId, moduleId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.createModuleItem(courseId, moduleId, body)];
            });
        });
    };
    CanvasController.prototype.getModuleItems = function (courseId, moduleId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.getModuleItems(courseId, moduleId)];
            });
        });
    };
    CanvasController.prototype.deleteModuleItem = function (courseId, moduleId, itemId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.deleteModuleItem(courseId, {
                        type: body.type,
                        content_id: body.content_id,
                    })];
            });
        });
    };
    CanvasController.prototype.bulkDeleteFiles = function (courseId, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canvasService.bulkDeleteFiles(courseId, body.fileIds, body.isFolders || [])];
            });
        });
    };
    CanvasController.prototype.deleteFileOrFolder = function (courseId, fileId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var results, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.canvasService.bulkDeleteFiles(courseId, [fileId], [!!(body === null || body === void 0 ? void 0 : body.isFolder)])];
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
    CanvasController.prototype.updateFileOrFolder = function (courseId, fileId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var newName;
            var _a;
            return __generator(this, function (_b) {
                newName = (_a = body.name) !== null && _a !== void 0 ? _a : body.display_name;
                if (!newName)
                    throw new common_1.HttpException('name or display_name required', common_1.HttpStatus.BAD_REQUEST);
                if (body.isFolder)
                    return [2 /*return*/, this.canvasService.renameFolder(fileId, newName)];
                return [2 /*return*/, this.canvasService.renameFile(courseId, fileId, newName)];
            });
        });
    };
    __decorate([
        (0, common_1.Get)('courses'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourses", null);
    __decorate([
        (0, common_1.Get)('courses/:id'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseDetails", null);
    __decorate([
        (0, common_1.Get)('courses/:id/students'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseStudents", null);
    __decorate([
        (0, common_1.Get)('courses/:id/quizzes'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseQuizzes", null);
    __decorate([
        (0, common_1.Get)('courses/:id/assignments'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseAssignments", null);
    __decorate([
        (0, common_1.Get)('courses/:id/assignment_groups'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseAssignmentGroups", null);
    __decorate([
        (0, common_1.Post)('courses/:id/assignment_groups'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createAssignmentGroup", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/assignment_groups/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateAssignmentGroup", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/assignment_groups/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteAssignmentGroup", null);
    __decorate([
        (0, common_1.Get)('courses/:id/discussions'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseDiscussions", null);
    __decorate([
        (0, common_1.Get)('courses/:id/pages'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCoursePages", null);
    __decorate([
        (0, common_1.Get)('courses/:id/announcements'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseAnnouncements", null);
    __decorate([
        (0, common_1.Get)('courses/:id/modules'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseModules", null);
    __decorate([
        (0, common_1.Get)('courses/:id/files'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseFiles", null);
    __decorate([
        (0, common_1.Get)('courses/:id/accommodations'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseAccommodations", null);
    __decorate([
        (0, common_1.Get)('courses/:id/accommodations/ensure-columns'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "ensureAccommodationColumns", null);
    __decorate([
        (0, common_1.Get)('courses/:id/accommodations/data'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getAccommodationData", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/accommodations/columns/:columnId/users/:userId'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('columnId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
        __param(3, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "saveAccommodationValue", null);
    __decorate([
        (0, common_1.Get)('courses/:id/custom_gradebook_columns'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCustomGradebookColumns", null);
    __decorate([
        (0, common_1.Get)('courses/:id/accreditation/profile'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getAccreditationProfile", null);
    __decorate([
        (0, common_1.Put)('courses/:id/accreditation/profile'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "saveAccreditationProfile", null);
    __decorate([
        (0, common_1.Get)('courses/:id/accreditation/accreditors'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Query)('cip')),
        __param(2, (0, common_1.Query)('degree_level')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, String, String]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getAccreditors", null);
    __decorate([
        (0, common_1.Get)('courses/:id/accreditation/outcomes'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getCourseOutcomeLinks", null);
    __decorate([
        (0, common_1.Put)('outcomes/:outcomeId/standards'),
        __param(0, (0, common_1.Param)('outcomeId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateOutcomeStandards", null);
    __decorate([
        (0, common_1.Get)('courses/:id/bulk_user_tags'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getBulkUserTags", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/assignments/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getAssignment", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/quizzes/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getQuiz", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/discussions/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getDiscussion", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/pages/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, String]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getPage", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/announcements/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getAnnouncement", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/modules/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getModule", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/assignments/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateAssignment", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/quizzes/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateQuiz", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/discussions/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateDiscussion", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/pages/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id')),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, String, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updatePage", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/announcements/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateAnnouncement", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/modules/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateModule", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/assignments/bulk'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "bulkUpdateAssignments", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/quizzes/bulk'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "bulkUpdateQuizzes", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/discussions/bulk'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "bulkUpdateDiscussions", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/pages/bulk'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "bulkUpdatePages", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/announcements/bulk'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "bulkUpdateAnnouncements", null);
    __decorate([
        (0, common_1.Put)('courses/:courseId/modules/bulk'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "bulkUpdateModules", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/assignments/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteAssignment", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/quizzes/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteQuiz", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/discussions/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteDiscussion", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/pages/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, String]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deletePage", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/modules/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteModule", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/announcements/:id'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteAnnouncement", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/content_exports'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createContentExport", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/assignments'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createAssignment", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/quizzes'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createQuiz", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/discussions'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createDiscussion", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/pages'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createPage", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/announcements'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createAnnouncement", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/modules'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createModule", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/quizzes/:quizId/extensions'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('quizId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createQuizExtensions", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/assignments/:assignmentId/overrides'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('assignmentId', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getAssignmentOverrides", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/assignments/:assignmentId/overrides/:overrideId'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('assignmentId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Param)('overrideId', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteAssignmentOverride", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/assignments/:assignmentId/overrides'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('assignmentId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createAssignmentOverride", null);
    __decorate([
        (0, common_1.Post)('courses/:courseId/modules/:moduleId/items'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('moduleId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "createModuleItem", null);
    __decorate([
        (0, common_1.Get)('courses/:courseId/modules/:moduleId/items'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('moduleId', common_1.ParseIntPipe)),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "getModuleItems", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/modules/:moduleId/items/:itemId'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('moduleId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Param)('itemId')),
        __param(3, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, String, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteModuleItem", null);
    __decorate([
        (0, common_1.Delete)('courses/:id/files/bulk'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "bulkDeleteFiles", null);
    __decorate([
        (0, common_1.Delete)('courses/:courseId/files/:fileId'),
        __param(0, (0, common_1.Param)('courseId', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('fileId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "deleteFileOrFolder", null);
    __decorate([
        (0, common_1.Put)('courses/:id/files/:fileId'),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Param)('fileId', common_1.ParseIntPipe)),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Number, Object]),
        __metadata("design:returntype", Promise)
    ], CanvasController.prototype, "updateFileOrFolder", null);
    CanvasController = __decorate([
        (0, common_1.Controller)('canvas'),
        __metadata("design:paramtypes", [canvas_service_1.CanvasService])
    ], CanvasController);
    return CanvasController;
}());
exports.CanvasController = CanvasController;

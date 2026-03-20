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
exports.CollegeScorecardController = void 0;
var common_1 = require("@nestjs/common");
var college_scorecard_service_1 = require("./college-scorecard.service");
var CollegeScorecardController = /** @class */ (function () {
    function CollegeScorecardController(service) {
        this.service = service;
    }
    CollegeScorecardController.prototype.getCities = function (state) {
        return __awaiter(this, void 0, void 0, function () {
            var stateParam, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stateParam = state || '';
                        console.log('[CollegeScorecard] getCities requested, state=', JSON.stringify(stateParam));
                        return [4 /*yield*/, this.service.getCitiesByState(stateParam)];
                    case 1:
                        result = _a.sent();
                        console.log('[CollegeScorecard] getCities result:', Array.isArray(result) ? "".concat(result.length, " cities") : JSON.stringify(result));
                        return [2 /*return*/, result];
                }
            });
        });
    };
    CollegeScorecardController.prototype.getInstitutions = function (state, city) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.service.getInstitutionsByStateCity(state || '', city || '')];
            });
        });
    };
    CollegeScorecardController.prototype.getPrograms = function (schoolId) {
        return __awaiter(this, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                id = parseInt(schoolId || '0', 10);
                return [2 /*return*/, this.service.getProgramsBySchoolId(id)];
            });
        });
    };
    CollegeScorecardController.prototype.getProgramsCip4 = function (schoolId) {
        return __awaiter(this, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                id = parseInt(schoolId || '0', 10);
                return [2 /*return*/, this.service.getProgramsCip4BySchoolId(id)];
            });
        });
    };
    CollegeScorecardController.prototype.getCip6Options = function (cip4) {
        return this.service.getCip6OptionsForCip4(cip4 || '');
    };
    __decorate([
        (0, common_1.Get)('cities'),
        __param(0, (0, common_1.Query)('state')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], CollegeScorecardController.prototype, "getCities", null);
    __decorate([
        (0, common_1.Get)('institutions'),
        __param(0, (0, common_1.Query)('state')),
        __param(1, (0, common_1.Query)('city')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String]),
        __metadata("design:returntype", Promise)
    ], CollegeScorecardController.prototype, "getInstitutions", null);
    __decorate([
        (0, common_1.Get)('programs'),
        __param(0, (0, common_1.Query)('schoolId')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], CollegeScorecardController.prototype, "getPrograms", null);
    __decorate([
        (0, common_1.Get)('programs-cip4'),
        __param(0, (0, common_1.Query)('schoolId')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], CollegeScorecardController.prototype, "getProgramsCip4", null);
    __decorate([
        (0, common_1.Get)('cip6-options'),
        __param(0, (0, common_1.Query)('cip4')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], CollegeScorecardController.prototype, "getCip6Options", null);
    CollegeScorecardController = __decorate([
        (0, common_1.Controller)('college-scorecard'),
        __metadata("design:paramtypes", [college_scorecard_service_1.CollegeScorecardService])
    ], CollegeScorecardController);
    return CollegeScorecardController;
}());
exports.CollegeScorecardController = CollegeScorecardController;

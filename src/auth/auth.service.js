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
exports.AuthService = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var deployment_mode_1 = require("./deployment-mode");
var AuthService = /** @class */ (function () {
    function AuthService(configService) {
        this.configService = configService;
    }
    AuthService.prototype.validateCanvasToken = function (token, baseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(baseUrl, "/users/self"), {
                                headers: {
                                    'Authorization': "Bearer ".concat(token),
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.ok) {
                            return [2 /*return*/, true];
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Token validation error:', error_1);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.getDeploymentMode = function (req) {
        return (0, deployment_mode_1.getDeploymentMode)(req);
    };
    AuthService.prototype.getAuthStatus = function (req) {
        var mode = this.getDeploymentMode(req);
        var needsToken = false;
        switch (mode) {
            case deployment_mode_1.DeploymentMode.LOCAL:
                // Local: auto-populate from .env, no token needed
                needsToken = false;
                break;
            case deployment_mode_1.DeploymentMode.RENDER:
                // Render: require manual login
                needsToken = !req.session.canvasToken || !req.session.canvasUrl;
                break;
            case deployment_mode_1.DeploymentMode.LTI:
                // LTI: use LTI verification
                needsToken = !req.session.ltiVerified;
                break;
        }
        return {
            needsToken: needsToken,
            mode: mode,
            defaultUrl: (0, deployment_mode_1.getDefaultCanvasUrl)()
        };
    };
    AuthService.prototype.setToken = function (req, token, baseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var mode, isValid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mode = this.getDeploymentMode(req);
                        if (mode !== deployment_mode_1.DeploymentMode.RENDER) {
                            throw new common_1.BadRequestException('Token setting only allowed in Render mode');
                        }
                        return [4 /*yield*/, this.validateCanvasToken(token, baseUrl)];
                    case 1:
                        isValid = _a.sent();
                        if (!isValid) {
                            return [2 /*return*/, { success: false, message: 'Invalid Canvas API token' }];
                        }
                        req.session.canvasToken = token;
                        req.session.canvasUrl = baseUrl.replace(/\/+$/, "");
                        return [2 /*return*/, new Promise(function (resolve) {
                                req.session.save(function (err) {
                                    if (err) {
                                        resolve({ success: false, message: 'Failed to save session' });
                                    }
                                    resolve({ success: true });
                                });
                            })];
                }
            });
        });
    };
    AuthService.prototype.setLtiSession = function (req, courseId) {
        req.session.ltiVerified = true;
        req.session.courseId = courseId;
    };
    AuthService.prototype.getAppName = function () {
        return 'Canvas Bulk Editor';
    };
    AuthService = __decorate([
        (0, common_1.Injectable)(),
        __metadata("design:paramtypes", [config_1.ConfigService])
    ], AuthService);
    return AuthService;
}());
exports.AuthService = AuthService;

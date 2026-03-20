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
exports.AppController = void 0;
var common_1 = require("@nestjs/common");
var AppController = /** @class */ (function () {
    function AppController() {
    }
    AppController.prototype.testPath = function () {
        return { status: 'ok' };
    };
    AppController.prototype.debugCheck = function () {
        return { status: 'AppController is alive' };
    };
    AppController.prototype.root = function (courseId, error, req) {
        var _a, _b, _c, _d;
        var ltiVerified = !!((_a = req === null || req === void 0 ? void 0 : req.session) === null || _a === void 0 ? void 0 : _a.ltiVerified);
        var hasToken = !!((_b = req === null || req === void 0 ? void 0 : req.session) === null || _b === void 0 ? void 0 : _b.canvasToken) && !!((_c = req === null || req === void 0 ? void 0 : req.session) === null || _c === void 0 ? void 0 : _c.canvasUrl);
        var isProduction = process.env.NODE_ENV === 'production';
        if (error) {
            return {
                deploymentMode: 'lti',
                error: decodeURIComponent(error || ''),
                courseId: null,
                needsToken: false,
                modePassword: process.env.MODE_PASSWORD || 'dev2025'
            };
        }
        if (ltiVerified && !hasToken) {
            return {
                deploymentMode: 'lti',
                ltiVerified: true,
                needsOAuth: true,
                courseId: req.session.courseId || courseId || null,
                modePassword: process.env.MODE_PASSWORD || 'dev2025'
            };
        }
        if (ltiVerified && hasToken) {
            return {
                deploymentMode: 'lti',
                ltiVerified: true,
                autoLoad: true,
                courseId: req.session.courseId || courseId || null,
                modePassword: process.env.MODE_PASSWORD || 'dev2025'
            };
        }
        if (isProduction || process.env.RENDER || ((_d = req === null || req === void 0 ? void 0 : req.get) === null || _d === void 0 ? void 0 : _d.call(req, 'x-render'))) {
            return {
                deploymentMode: 'render',
                courseId: courseId || null,
                autoLoad: false,
                showLoginModal: !hasToken,
                needsToken: !hasToken,
                defaultCanvasUrl: 'https://canvas.instructure.com/api/v1',
                modePassword: process.env.MODE_PASSWORD || 'dev2025'
            };
        }
        return {
            deploymentMode: 'local',
            courseId: courseId || null,
            autoLoad: false,
            showLoginModal: !hasToken,
            needsToken: !hasToken,
            defaultCanvasUrl: process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1',
            modePassword: process.env.MODE_PASSWORD || 'dev2025'
        };
    };
    AppController.prototype.getStatus = function (req) {
        var _a, _b, _c, _d;
        var ltiVerified = !!((_a = req.session) === null || _a === void 0 ? void 0 : _a.ltiVerified);
        var hasToken = !!((_b = req.session) === null || _b === void 0 ? void 0 : _b.canvasToken) && !!((_c = req.session) === null || _c === void 0 ? void 0 : _c.canvasUrl);
        var needsOAuth = ltiVerified && !hasToken;
        var needsToken = !ltiVerified && !hasToken;
        var defaultUrl = ((_d = req.session) === null || _d === void 0 ? void 0 : _d.canvasApiDomain)
            ? "".concat(req.session.canvasApiDomain.replace(/\/api\/v1\/?$/, ''), "/api/v1")
            : (process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1');
        return {
            needsToken: needsOAuth || needsToken,
            needsOAuth: needsOAuth,
            ltiVerified: ltiVerified,
            hasToken: hasToken,
            defaultUrl: defaultUrl
        };
    };
    AppController.prototype.setToken = function (body, req) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (body.token && body.canvasUrl && req.session) {
                    req.session.canvasToken = body.token;
                    req.session.canvasUrl = body.canvasUrl.replace(/\/+$/, '');
                    if (!req.session.canvasUrl.endsWith('/api/v1')) {
                        req.session.canvasUrl = req.session.canvasUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';
                    }
                    return [2 /*return*/, new Promise(function (resolve) {
                            req.session.save(function (err) {
                                if (err)
                                    resolve({ success: false });
                                resolve({ success: true });
                            });
                        })];
                }
                return [2 /*return*/, { success: false, message: 'Invalid credentials' }];
            });
        });
    };
    __decorate([
        (0, common_1.Get)('test-path'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], AppController.prototype, "testPath", null);
    __decorate([
        (0, common_1.Get)('debug-check'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], AppController.prototype, "debugCheck", null);
    __decorate([
        (0, common_1.Get)(),
        (0, common_1.Render)('index'),
        __param(0, (0, common_1.Query)('courseId')),
        __param(1, (0, common_1.Query)('error')),
        __param(2, (0, common_1.Req)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String, Object]),
        __metadata("design:returntype", void 0)
    ], AppController.prototype, "root", null);
    __decorate([
        (0, common_1.Get)('auth/status'),
        __param(0, (0, common_1.Req)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], AppController.prototype, "getStatus", null);
    __decorate([
        (0, common_1.Post)('auth/set-token'),
        __param(0, (0, common_1.Body)()),
        __param(1, (0, common_1.Req)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "setToken", null);
    AppController = __decorate([
        (0, common_1.Controller)()
    ], AppController);
    return AppController;
}());
exports.AppController = AppController;

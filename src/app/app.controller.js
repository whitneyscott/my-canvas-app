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
exports.AppController = void 0;
var common_1 = require("@nestjs/common");
var AppController = function () {
    var _classDecorators = [(0, common_1.Controller)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _testPath_decorators;
    var _debugCheck_decorators;
    var _root_decorators;
    var _getStatus_decorators;
    var _setToken_decorators;
    var AppController = _classThis = /** @class */ (function () {
        function AppController_1() {
            __runInitializers(this, _instanceExtraInitializers);
        }
        AppController_1.prototype.testPath = function () {
            return { status: 'ok' };
        };
        AppController_1.prototype.debugCheck = function () {
            return { status: 'AppController is alive' };
        };
        AppController_1.prototype.root = function (req, courseId, errQuery) {
            var _a, _b, _c, _d, _e;
            var ltiVerified = !!((_a = req === null || req === void 0 ? void 0 : req.session) === null || _a === void 0 ? void 0 : _a.ltiVerified);
            var hasToken = !!((_b = req === null || req === void 0 ? void 0 : req.session) === null || _b === void 0 ? void 0 : _b.canvasToken) && !!((_c = req === null || req === void 0 ? void 0 : req.session) === null || _c === void 0 ? void 0 : _c.canvasUrl);
            var ltiLaunchType = (_d = req === null || req === void 0 ? void 0 : req.session) === null || _d === void 0 ? void 0 : _d.ltiLaunchType;
            var isProduction = process.env.NODE_ENV === 'production';
            if (errQuery) {
                return {
                    deploymentMode: 'lti',
                    error: decodeURIComponent(errQuery || ''),
                    courseId: null,
                    needsToken: false,
                    modePassword: process.env.MODE_PASSWORD || 'dev2025',
                };
            }
            if (ltiVerified && !hasToken) {
                var needsOAuth = ltiLaunchType !== '1.1';
                return {
                    deploymentMode: 'lti',
                    ltiVerified: true,
                    needsOAuth: needsOAuth,
                    needsToken: true,
                    courseId: req.session.courseId || courseId || null,
                    modePassword: process.env.MODE_PASSWORD || 'dev2025',
                };
            }
            if (ltiVerified && hasToken) {
                return {
                    deploymentMode: 'lti',
                    ltiVerified: true,
                    autoLoad: true,
                    courseId: req.session.courseId || courseId || null,
                    modePassword: process.env.MODE_PASSWORD || 'dev2025',
                };
            }
            if (isProduction || process.env.RENDER || ((_e = req === null || req === void 0 ? void 0 : req.get) === null || _e === void 0 ? void 0 : _e.call(req, 'x-render'))) {
                return {
                    deploymentMode: 'render',
                    courseId: courseId || null,
                    autoLoad: false,
                    showLoginModal: !hasToken,
                    needsToken: !hasToken,
                    defaultCanvasUrl: 'https://canvas.instructure.com/api/v1',
                    modePassword: process.env.MODE_PASSWORD || 'dev2025',
                };
            }
            return {
                deploymentMode: 'local',
                courseId: courseId || null,
                autoLoad: false,
                showLoginModal: !hasToken,
                needsToken: !hasToken,
                defaultCanvasUrl: process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1',
                modePassword: process.env.MODE_PASSWORD || 'dev2025',
            };
        };
        AppController_1.prototype.getStatus = function (req) {
            var _a, _b, _c, _d, _e;
            var ltiVerified = !!((_a = req.session) === null || _a === void 0 ? void 0 : _a.ltiVerified);
            var hasToken = !!((_b = req.session) === null || _b === void 0 ? void 0 : _b.canvasToken) && !!((_c = req.session) === null || _c === void 0 ? void 0 : _c.canvasUrl);
            var ltiLaunchType = (_d = req.session) === null || _d === void 0 ? void 0 : _d.ltiLaunchType;
            var needsOAuth = ltiVerified && !hasToken && ltiLaunchType !== '1.1';
            var needsToken = !hasToken;
            var defaultUrl = ((_e = req.session) === null || _e === void 0 ? void 0 : _e.canvasApiDomain)
                ? "".concat(req.session.canvasApiDomain.replace(/\/api\/v1\/?$/, ''), "/api/v1")
                : process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1';
            return {
                needsToken: needsOAuth || needsToken,
                needsOAuth: needsOAuth,
                ltiVerified: ltiVerified,
                hasToken: hasToken,
                defaultUrl: defaultUrl,
            };
        };
        AppController_1.prototype.setToken = function (body, req) {
            return __awaiter(this, void 0, void 0, function () {
                var normalizedUrl, probeUrl, probeRes, _a, raw, detail;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(body === null || body === void 0 ? void 0 : body.token) || !(body === null || body === void 0 ? void 0 : body.canvasUrl) || !req.session) {
                                throw new common_1.HttpException('Canvas URL and API token are required.', common_1.HttpStatus.BAD_REQUEST);
                            }
                            normalizedUrl = body.canvasUrl.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '') +
                                '/api/v1';
                            probeUrl = "".concat(normalizedUrl, "/users/self");
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, fetch(probeUrl, {
                                    headers: { Authorization: "Bearer ".concat(body.token) },
                                })];
                        case 2:
                            probeRes = _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            throw new common_1.HttpException('Could not reach Canvas. Check the Canvas URL and your network connection, then try again.', common_1.HttpStatus.BAD_GATEWAY);
                        case 4:
                            if (!!probeRes.ok) return [3 /*break*/, 6];
                            return [4 /*yield*/, probeRes.text()];
                        case 5:
                            raw = _b.sent();
                            detail = raw && raw.length < 300 ? raw : '';
                            throw new common_1.HttpException("Canvas rejected the token or URL (".concat(probeRes.status, " ").concat(probeRes.statusText, "). ").concat(detail).trim(), common_1.HttpStatus.UNAUTHORIZED);
                        case 6:
                            req.session.canvasToken = body.token;
                            req.session.canvasUrl = normalizedUrl;
                            return [2 /*return*/, new Promise(function (resolve) {
                                    req.session.save(function (err) {
                                        if (err) {
                                            resolve({ success: false, message: 'Failed to save session.' });
                                            return;
                                        }
                                        resolve({ success: true });
                                    });
                                })];
                    }
                });
            });
        };
        return AppController_1;
    }());
    __setFunctionName(_classThis, "AppController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _testPath_decorators = [(0, common_1.Get)('test-path')];
        _debugCheck_decorators = [(0, common_1.Get)('debug-check')];
        _root_decorators = [(0, common_1.Get)(), (0, common_1.Render)('index')];
        _getStatus_decorators = [(0, common_1.Get)('auth/status')];
        _setToken_decorators = [(0, common_1.Post)('auth/set-token')];
        __esDecorate(_classThis, null, _testPath_decorators, { kind: "method", name: "testPath", static: false, private: false, access: { has: function (obj) { return "testPath" in obj; }, get: function (obj) { return obj.testPath; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _debugCheck_decorators, { kind: "method", name: "debugCheck", static: false, private: false, access: { has: function (obj) { return "debugCheck" in obj; }, get: function (obj) { return obj.debugCheck; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _root_decorators, { kind: "method", name: "root", static: false, private: false, access: { has: function (obj) { return "root" in obj; }, get: function (obj) { return obj.root; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: function (obj) { return "getStatus" in obj; }, get: function (obj) { return obj.getStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _setToken_decorators, { kind: "method", name: "setToken", static: false, private: false, access: { has: function (obj) { return "setToken" in obj; }, get: function (obj) { return obj.setToken; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppController = _classThis;
}();
exports.AppController = AppController;

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
exports.LaunchVerifyService = void 0;
var common_1 = require("@nestjs/common");
var jose = require("jose");
var crypto_1 = require("crypto");
var LaunchVerifyService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LaunchVerifyService = _classThis = /** @class */ (function () {
        function LaunchVerifyService_1(config) {
            this.config = config;
        }
        LaunchVerifyService_1.prototype.verify = function (idToken) {
            return __awaiter(this, void 0, void 0, function () {
                var expectedClientId, unprotected, payload, iss, jwksUrl, jwksRes, jwks, jwk, _a, _b, _c, err_1, key, _d, headerB64, payloadB64, sigB64, data, sig, ok, aud, audienceOk;
                var _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            expectedClientId = this.config.get('LTI_CLIENT_ID');
                            unprotected = jose.decodeProtectedHeader(idToken);
                            if (!unprotected.alg || !unprotected.kid)
                                throw new Error('Invalid JWT header');
                            payload = jose.decodeJwt(idToken);
                            iss = payload.iss;
                            if (!iss || typeof iss !== 'string')
                                throw new Error('Missing iss');
                            jwksUrl = "".concat(iss.replace(/\/$/, ''), "/api/lti/security/jwks");
                            return [4 /*yield*/, fetch(jwksUrl)];
                        case 1:
                            jwksRes = _g.sent();
                            if (!jwksRes.ok)
                                throw new Error("JWKS fetch failed: ".concat(jwksRes.status));
                            return [4 /*yield*/, jwksRes.json()];
                        case 2:
                            jwks = (_g.sent());
                            jwk = ((_e = jwks.keys) === null || _e === void 0 ? void 0 : _e.find(function (k) { return k.kid === unprotected.kid; })) ||
                                ((_f = jwks.keys) === null || _f === void 0 ? void 0 : _f[0]);
                            if (!jwk)
                                throw new Error('Could not resolve JWK');
                            _g.label = 3;
                        case 3:
                            _g.trys.push([3, 6, , 7]);
                            _b = (_a = jose).compactVerify;
                            _c = [idToken];
                            return [4 /*yield*/, jose.importJWK(jwk, unprotected.alg)];
                        case 4: return [4 /*yield*/, _b.apply(_a, _c.concat([_g.sent()]))];
                        case 5:
                            _g.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            err_1 = _g.sent();
                            if (String(err_1).includes('2048') ||
                                String(err_1).includes('modulusLength')) {
                                key = (0, crypto_1.createPublicKey)({
                                    key: jwk,
                                    format: 'jwk',
                                });
                                _d = idToken.split('.'), headerB64 = _d[0], payloadB64 = _d[1], sigB64 = _d[2];
                                data = Buffer.from("".concat(headerB64, ".").concat(payloadB64), 'utf8');
                                sig = Buffer.from(sigB64, 'base64url');
                                ok = (0, crypto_1.verify)('RSA-SHA256', data, key, sig);
                                if (!ok)
                                    throw new Error('Invalid signature');
                            }
                            else {
                                throw err_1;
                            }
                            return [3 /*break*/, 7];
                        case 7:
                            if (expectedClientId) {
                                aud = payload.aud;
                                audienceOk = Array.isArray(aud)
                                    ? aud.includes(expectedClientId)
                                    : aud === expectedClientId;
                                if (!audienceOk)
                                    throw new Error('Invalid audience');
                            }
                            return [2 /*return*/, payload];
                    }
                });
            });
        };
        return LaunchVerifyService_1;
    }());
    __setFunctionName(_classThis, "LaunchVerifyService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LaunchVerifyService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LaunchVerifyService = _classThis;
}();
exports.LaunchVerifyService = LaunchVerifyService;

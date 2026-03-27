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
exports.OAuthController = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var oauth_state_store_1 = require("./oauth-state.store");
var lti_debug_1 = require("./lti.debug");
var OAuthController = function () {
    var _classDecorators = [(0, common_1.Controller)('oauth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _canvasAuth_decorators;
    var _canvasCallback_decorators;
    var OAuthController = _classThis = /** @class */ (function () {
        function OAuthController_1(config) {
            this.config = (__runInitializers(this, _instanceExtraInitializers), config);
        }
        OAuthController_1.prototype.canvasAuth = function (req, res) {
            var _a, _b, _c, _d;
            var sess = req.session;
            if (!sess.ltiVerified || !sess.canvasApiDomain) {
                (0, lti_debug_1.log)('oauth_error', { error: 'Launch via LTI first' });
                return res.redirect('/lti/debug?error=' + encodeURIComponent('Launch via LTI first'));
            }
            (0, lti_debug_1.log)('oauth_session_check', {
                ltiLaunchType: (_a = sess.ltiLaunchType) !== null && _a !== void 0 ? _a : '(undefined)',
                ltiClientId: (_b = sess.ltiClientId) !== null && _b !== void 0 ? _b : '(undefined)',
                courseId: (_c = sess.courseId) !== null && _c !== void 0 ? _c : '(undefined)',
                canvasApiDomain: (_d = sess.canvasApiDomain) !== null && _d !== void 0 ? _d : '(undefined)',
            });
            if (sess.ltiLaunchType === '1.1') {
                var returnUrl_1 = req.query.returnUrl || '/';
                (0, lti_debug_1.log)('oauth_skipped', {
                    reason: 'LTI_1.1 uses manual token flow',
                    returnUrl: returnUrl_1,
                });
                return res.redirect(returnUrl_1);
            }
            var apiKeyClientId = this.config.get('CANVAS_OAUTH_CLIENT_ID');
            var apiKeyValid = apiKeyClientId && apiKeyClientId !== 'your_canvas_oauth_client_id';
            var clientId = (apiKeyValid ? apiKeyClientId : null) ||
                sess.ltiClientId ||
                this.config.get('LTI_CLIENT_ID') ||
                null;
            (0, lti_debug_1.log)('oauth_client_selected', {
                source: sess.ltiLaunchType === '1.3' ? 'LTI_1.3' : 'fallback',
                useApiKey: !!apiKeyValid,
                useLtiClientId: !!sess.ltiClientId,
                clientIdPrefix: (clientId === null || clientId === void 0 ? void 0 : clientId.slice(0, 8)) + '...',
            });
            var appUrl = this.config.get('APP_URL') || 'http://localhost:3000';
            if (!clientId) {
                (0, lti_debug_1.log)('oauth_error', { error: 'OAuth client ID not configured' });
                return res.redirect('/lti/debug?error=' +
                    encodeURIComponent('OAuth client ID not configured'));
            }
            var state = (0, crypto_1.randomBytes)(16).toString('hex');
            var returnUrl = req.query.returnUrl || '/';
            (0, oauth_state_store_1.setOAuthState)(state, returnUrl);
            var base = String(sess.canvasApiDomain)
                .replace(/\/$/, '')
                .replace(/\/api\/v1\/?$/, '');
            var redirectUri = "".concat(appUrl.replace(/\/$/, ''), "/oauth/canvas/callback");
            (0, lti_debug_1.log)('oauth_redirect', {
                clientIdPrefix: (clientId === null || clientId === void 0 ? void 0 : clientId.slice(0, 12)) + '...',
                ltiLaunchType: sess.ltiLaunchType,
                canvasBase: base,
                redirectUri: redirectUri,
            });
            var forceConsent = req.query.retry === '1';
            var authUrl = "".concat(base, "/login/oauth2/auth") +
                "?client_id=".concat(encodeURIComponent(clientId)) +
                "&response_type=code" +
                "&redirect_uri=".concat(encodeURIComponent(redirectUri)) +
                "&state=".concat(encodeURIComponent(state)) +
                (forceConsent ? '' : "&prompt=none");
            return res.redirect(authUrl);
        };
        OAuthController_1.prototype.canvasCallback = function (code, state, oauthError, oauthErrorDesc, req, res) {
            return __awaiter(this, void 0, void 0, function () {
                var sessForLog, returnUrl_2, returnUrl, sess, apiKeyClientId, apiKeyValid, clientId, secretsJson, secretsMap, clientSecret, appUrl, base, redirectUri, tokenUrl, body, tokenRes, errText, data, token;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            sessForLog = req.session;
                            (0, lti_debug_1.log)('oauth_callback', {
                                hasCode: !!code,
                                hasState: !!state,
                                oauthError: oauthError || null,
                                oauthErrorDesc: oauthErrorDesc || null,
                                ltiLaunchType: (_a = sessForLog === null || sessForLog === void 0 ? void 0 : sessForLog.ltiLaunchType) !== null && _a !== void 0 ? _a : '(undefined)',
                            });
                            if (oauthError) {
                                returnUrl_2 = (0, oauth_state_store_1.getOAuthState)(state);
                                if ((oauthError === 'interaction_required' ||
                                    oauthError === 'login_required') &&
                                    returnUrl_2) {
                                    return [2 /*return*/, res.redirect("/oauth/canvas?returnUrl=".concat(encodeURIComponent(returnUrl_2), "&retry=1"))];
                                }
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent(oauthErrorDesc || oauthError))];
                            }
                            if (!code || !state) {
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Missing code or state'))];
                            }
                            returnUrl = (0, oauth_state_store_1.getOAuthState)(state);
                            if (!returnUrl) {
                                (0, lti_debug_1.log)('oauth_error', { error: 'Invalid or expired state' });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid or expired state'))];
                            }
                            sess = req.session;
                            if (!sess.canvasApiDomain) {
                                (0, lti_debug_1.log)('oauth_error', { error: 'Session expired' });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Session expired'))];
                            }
                            (0, lti_debug_1.log)('oauth_callback_client_select', {
                                ltiLaunchType: (_b = sess.ltiLaunchType) !== null && _b !== void 0 ? _b : '(undefined)',
                                ltiClientId: (_c = sess.ltiClientId) !== null && _c !== void 0 ? _c : '(undefined)',
                            });
                            apiKeyClientId = this.config.get('CANVAS_OAUTH_CLIENT_ID');
                            apiKeyValid = apiKeyClientId && apiKeyClientId !== 'your_canvas_oauth_client_id';
                            if (sess.ltiLaunchType === '1.1') {
                                clientId = apiKeyValid ? apiKeyClientId : null;
                            }
                            else {
                                clientId =
                                    (apiKeyValid ? apiKeyClientId : null) ||
                                        sess.ltiClientId ||
                                        this.config.get('LTI_CLIENT_ID') ||
                                        null;
                            }
                            secretsJson = this.config.get('CANVAS_OAUTH_CLIENT_SECRETS');
                            secretsMap = secretsJson
                                ? (function () {
                                    try {
                                        return JSON.parse(secretsJson);
                                    }
                                    catch (_a) {
                                        return null;
                                    }
                                })()
                                : null;
                            clientSecret = (secretsMap && clientId && secretsMap[clientId]) ||
                                this.config.get('CANVAS_OAUTH_CLIENT_SECRET');
                            appUrl = this.config.get('APP_URL') || 'http://localhost:3000';
                            if (!clientId || !clientSecret) {
                                (0, lti_debug_1.log)('oauth_error', {
                                    error: 'OAuth not configured',
                                    hasClientId: !!clientId,
                                    hasClientSecret: !!clientSecret,
                                });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('OAuth not configured'))];
                            }
                            base = String(sess.canvasApiDomain)
                                .replace(/\/$/, '')
                                .replace(/\/api\/v1\/?$/, '');
                            redirectUri = "".concat(appUrl.replace(/\/$/, ''), "/oauth/canvas/callback");
                            tokenUrl = "".concat(base, "/login/oauth2/token");
                            body = new URLSearchParams({
                                grant_type: 'authorization_code',
                                client_id: clientId,
                                client_secret: clientSecret,
                                redirect_uri: redirectUri,
                                code: code,
                            });
                            return [4 /*yield*/, fetch(tokenUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: body.toString(),
                                })];
                        case 1:
                            tokenRes = _d.sent();
                            if (!!tokenRes.ok) return [3 /*break*/, 3];
                            return [4 /*yield*/, tokenRes.text()];
                        case 2:
                            errText = _d.sent();
                            (0, lti_debug_1.log)('oauth_error', {
                                error: 'Token exchange failed',
                                status: tokenRes.status,
                                body: errText,
                            });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' +
                                    encodeURIComponent("Canvas OAuth token exchange failed: ".concat(tokenRes.status, " - ").concat(errText)))];
                        case 3: return [4 /*yield*/, tokenRes.json()];
                        case 4:
                            data = (_d.sent());
                            token = data === null || data === void 0 ? void 0 : data.access_token;
                            if (!token) {
                                (0, lti_debug_1.log)('oauth_error', { error: 'No access_token in Canvas response' });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' +
                                        encodeURIComponent('No access_token in Canvas response'))];
                            }
                            (0, lti_debug_1.log)('oauth_success', { canvasUrl: "".concat(base, "/api/v1") });
                            sess.canvasToken = token;
                            sess.canvasUrl = "".concat(base, "/api/v1");
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    sess.save(function (err) {
                                        if (err) {
                                            reject(err instanceof Error ? err : new Error((0, lti_debug_1.unknownToErrorMessage)(err)));
                                            return;
                                        }
                                        res.redirect(returnUrl);
                                        resolve();
                                    });
                                })];
                    }
                });
            });
        };
        return OAuthController_1;
    }());
    __setFunctionName(_classThis, "OAuthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _canvasAuth_decorators = [(0, common_1.Get)('canvas')];
        _canvasCallback_decorators = [(0, common_1.Get)('canvas/callback')];
        __esDecorate(_classThis, null, _canvasAuth_decorators, { kind: "method", name: "canvasAuth", static: false, private: false, access: { has: function (obj) { return "canvasAuth" in obj; }, get: function (obj) { return obj.canvasAuth; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _canvasCallback_decorators, { kind: "method", name: "canvasCallback", static: false, private: false, access: { has: function (obj) { return "canvasCallback" in obj; }, get: function (obj) { return obj.canvasCallback; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OAuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OAuthController = _classThis;
}();
exports.OAuthController = OAuthController;

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
exports.LtiController = void 0;
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var path_1 = require("path");
var state_store_1 = require("./state.store");
var lti_debug_1 = require("./lti.debug");
var LtiController = function () {
    var _classDecorators = [(0, common_1.Controller)('lti')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getJwks_decorators;
    var _debug_decorators;
    var _login_decorators;
    var _launch_decorators;
    var LtiController = _classThis = /** @class */ (function () {
        function LtiController_1(config, launchVerify, lti11Verify, platform, jwksService) {
            this.config = (__runInitializers(this, _instanceExtraInitializers), config);
            this.launchVerify = launchVerify;
            this.lti11Verify = lti11Verify;
            this.platform = platform;
            this.jwksService = jwksService;
        }
        LtiController_1.prototype.getJwks = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.jwksService.getJwksJson()];
                });
            });
        };
        LtiController_1.prototype.debug = function (errQuery, res) {
            var log = (0, lti_debug_1.getLog)();
            var err = errQuery ? decodeURIComponent(errQuery) : null;
            try {
                (0, fs_1.writeFileSync)((0, path_1.join)(process.cwd(), 'lti-debug-output.json'), JSON.stringify({ error: err, log: log, ts: new Date().toISOString() }, null, 2));
            }
            catch (_a) {
                void 0;
            }
            return res.render('lti-debug', { log: log, error: err });
        };
        LtiController_1.prototype.login = function (qIss, qLoginHint, qTargetLinkUri, qClientId, qLtiMessageHint, req, res) {
            return __awaiter(this, void 0, void 0, function () {
                var bodyObj, iss, loginHint, targetLinkUri, clientId, ltiMessageHint, expectedClientId, state, nonce, target, authUrl, redirectUri, params, redirect, err_1, msg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            bodyObj = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
                                ? req.body
                                : {};
                            iss = qIss || (typeof bodyObj.iss === 'string' ? bodyObj.iss : '');
                            loginHint = qLoginHint ||
                                (typeof bodyObj.login_hint === 'string' ? bodyObj.login_hint : '');
                            targetLinkUri = qTargetLinkUri ||
                                (typeof bodyObj.target_link_uri === 'string'
                                    ? bodyObj.target_link_uri
                                    : '');
                            clientId = qClientId ||
                                (typeof bodyObj.client_id === 'string' ? bodyObj.client_id : '');
                            ltiMessageHint = qLtiMessageHint ||
                                (typeof bodyObj.lti_message_hint === 'string'
                                    ? bodyObj.lti_message_hint
                                    : '');
                            (0, lti_debug_1.log)('login_received', {
                                method: req.method,
                                iss: iss,
                                loginHint: loginHint ? '[present]' : null,
                                targetLinkUri: targetLinkUri || null,
                                clientId: clientId,
                                ltiMessageHint: ltiMessageHint ? '[present]' : null,
                            });
                            if (!iss || !loginHint || !clientId) {
                                (0, lti_debug_1.log)('login_error', {
                                    error: 'Missing OIDC params',
                                    hasIss: !!iss,
                                    hasLoginHint: !!loginHint,
                                    hasClientId: !!clientId,
                                });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Missing OIDC params'))];
                            }
                            expectedClientId = this.config.get('LTI_CLIENT_ID');
                            if (expectedClientId && clientId !== expectedClientId) {
                                (0, lti_debug_1.log)('login_error', {
                                    error: 'Invalid client_id',
                                    received: clientId,
                                    expected: expectedClientId,
                                });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid client_id'))];
                            }
                            state = (0, crypto_1.randomBytes)(16).toString('hex');
                            nonce = (0, crypto_1.randomBytes)(16).toString('hex');
                            target = (typeof targetLinkUri === 'string' && targetLinkUri) ||
                                this.config.get('APP_URL') ||
                                '/';
                            (0, state_store_1.setState)(state, target, nonce);
                            return [4 /*yield*/, this.platform.getOidcAuthUrl(iss)];
                        case 1:
                            authUrl = _a.sent();
                            redirectUri = (this.config.get('APP_URL') || 'http://localhost:3000').replace(/\/$/, '') + '/lti/launch';
                            (0, lti_debug_1.log)('login_redirect', {
                                state: state.slice(0, 8) + '...',
                                target: target,
                                redirectUri: redirectUri,
                            });
                            params = new URLSearchParams({
                                scope: 'openid',
                                response_type: 'id_token',
                                client_id: clientId,
                                redirect_uri: redirectUri,
                                login_hint: loginHint,
                                state: state,
                                nonce: nonce,
                                response_mode: 'form_post',
                                prompt: 'none',
                            });
                            if (ltiMessageHint)
                                params.set('lti_message_hint', ltiMessageHint);
                            redirect = "".concat(authUrl, "?").concat(params.toString());
                            return [2 /*return*/, res.redirect(redirect)];
                        case 2:
                            err_1 = _a.sent();
                            msg = err_1 instanceof Error ? err_1.message : String(err_1);
                            (0, lti_debug_1.log)('login_error', { error: msg });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent(msg))];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        LtiController_1.prototype.launch = function (req, res) {
            return __awaiter(this, void 0, void 0, function () {
                var body, idToken, state, oauthSig, oauthKey;
                return __generator(this, function (_a) {
                    body = (req.body && typeof req.body === 'object' ? req.body : {});
                    idToken = (typeof body.id_token === 'string' && body.id_token) || null;
                    state = (typeof body.state === 'string' && body.state) || null;
                    oauthSig = (typeof body.oauth_signature === 'string' && body.oauth_signature) ||
                        null;
                    oauthKey = (typeof body.oauth_consumer_key === 'string' &&
                        body.oauth_consumer_key) ||
                        null;
                    (0, lti_debug_1.log)('launch_received', {
                        hasIdToken: !!idToken,
                        hasState: !!state,
                        statePreview: state ? state.slice(0, 8) + '...' : null,
                        lti11: !!(oauthKey && oauthSig),
                    });
                    if (idToken && state) {
                        (0, lti_debug_1.log)('lti_launch_branch', {
                            chosen: '1.3',
                            reason: 'id_token+state present',
                        });
                        return [2 /*return*/, this.handleLti13Launch(req, res, idToken, state)];
                    }
                    if (oauthKey && oauthSig) {
                        (0, lti_debug_1.log)('lti_launch_branch', {
                            chosen: '1.1',
                            reason: 'oauth_consumer_key+oauth_signature present',
                            consumerKey: oauthKey,
                        });
                        return [2 /*return*/, this.handleLti11Launch(req, res, body)];
                    }
                    (0, lti_debug_1.log)('launch_error', {
                        error: 'Not LTI 1.3 (missing id_token/state) and not LTI 1.1 (missing OAuth 1.0a fields)',
                    });
                    return [2 /*return*/, res.redirect('/lti/debug?error=' +
                            encodeURIComponent('Unknown launch: need LTI 1.3 id_token+state or LTI 1.1 oauth_consumer_key+oauth_signature'))];
                });
            });
        };
        LtiController_1.prototype.handleLti13Launch = function (req, res, idToken, state) {
            return __awaiter(this, void 0, void 0, function () {
                var stored, claims, err_2, context, custom, roles, rawCourseId, courseId, isInstructor, sess, aud, rawDomain;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            stored = (0, state_store_1.getState)(state);
                            if (!stored) {
                                (0, lti_debug_1.log)('launch_error', {
                                    error: 'Invalid or expired state',
                                    statePreview: state.slice(0, 8) + '...',
                                });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid or expired state'))];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.launchVerify.verify(idToken)];
                        case 2:
                            claims = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            err_2 = _a.sent();
                            (0, lti_debug_1.log)('launch_error', {
                                error: String(err_2 instanceof Error ? err_2.message : err_2),
                            });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' +
                                    encodeURIComponent(String(err_2 instanceof Error ? err_2.message : err_2)))];
                        case 4:
                            if (claims.nonce && claims.nonce !== stored.nonce) {
                                (0, lti_debug_1.log)('launch_error', { error: 'Nonce mismatch' });
                                return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Nonce mismatch'))];
                            }
                            context = claims['https://purl.imsglobal.org/spec/lti/claim/context'];
                            custom = claims['https://purl.imsglobal.org/spec/lti/claim/custom'] || {};
                            roles = claims['https://purl.imsglobal.org/spec/lti/claim/roles'] ||
                                [];
                            rawCourseId = String((context === null || context === void 0 ? void 0 : context.id) ||
                                custom.custom_canvas_course_id ||
                                custom.canvas_course_id ||
                                '');
                            courseId = this.extractNumericCourseId(rawCourseId) || rawCourseId;
                            isInstructor = roles.some(function (r) {
                                return /instructor|contentdeveloper|urn:lti:sysrole:ims\/lis\/teaching/i.test(r);
                            });
                            if (!isInstructor) {
                                return [2 /*return*/, res.redirect('/?error=' +
                                        encodeURIComponent('Access Denied: Only instructors can use this tool.'))];
                            }
                            sess = req.session;
                            sess.ltiVerified = true;
                            sess.ltiLaunchType = '1.3';
                            sess.courseId = courseId;
                            sess.ltiSub = String(claims.sub || '');
                            aud = claims.aud;
                            sess.ltiClientId = Array.isArray(aud)
                                ? String(aud[0] || '')
                                : String(aud || '');
                            rawDomain = custom.custom_canvas_api_domain ||
                                custom.canvas_api_domain ||
                                this.issToApiDomain(String(claims.iss || ''));
                            sess.canvasApiDomain = rawDomain.startsWith('http')
                                ? rawDomain
                                : 'https://' + rawDomain.replace(/^\/+|\/+$/g, '');
                            (0, lti_debug_1.log)('launch_success', {
                                courseId: courseId,
                                rawCourseId: rawCourseId !== courseId ? rawCourseId : undefined,
                                canvasApiDomain: sess.canvasApiDomain,
                                ltiClientId: sess.ltiClientId,
                            });
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    sess.save(function (err) {
                                        if (err) {
                                            reject(err instanceof Error ? err : new Error((0, lti_debug_1.unknownToErrorMessage)(err)));
                                            return;
                                        }
                                        var returnPath = (stored.target || '/').replace(/\/$/, '') +
                                            '/?courseId=' +
                                            encodeURIComponent(courseId);
                                        res.redirect('/oauth/canvas?returnUrl=' + encodeURIComponent(returnPath));
                                        resolve();
                                    });
                                })];
                    }
                });
            });
        };
        LtiController_1.prototype.extractNumericCourseId = function (val) {
            if (!val || typeof val !== 'string')
                return null;
            var s = val.trim();
            if (!s)
                return null;
            if (/^\d+$/.test(s))
                return s;
            var m = s.match(/\/(\d+)(?:\?|$)/) || s.match(/(\d+)$/);
            return m ? m[1] : null;
        };
        LtiController_1.prototype.issToApiDomain = function (iss) {
            var u = iss.replace(/\/$/, '');
            if (u.includes('canvas.instructure.com'))
                return 'https://canvas.instructure.com';
            return u;
        };
        LtiController_1.prototype.buildLaunchUrl = function (req) {
            var _a, _b, _c;
            var forwardedProto = (_b = (_a = req.get('x-forwarded-proto')) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim();
            var proto = forwardedProto || req.protocol || 'https';
            var host = (_c = (req.get('x-forwarded-host') || req.get('host') || '')
                .split(',')[0]) === null || _c === void 0 ? void 0 : _c.trim();
            if (!host) {
                var app = (this.config.get('APP_URL') || '').replace(/\/$/, '');
                if (app.startsWith('http')) {
                    return "".concat(app, "/lti/launch");
                }
                throw new Error('Cannot determine launch URL host');
            }
            return "".concat(proto, "://").concat(host, "/lti/launch");
        };
        LtiController_1.prototype.lti11RolesAllowInstructor = function (roles) {
            var parts = roles
                .split(/[,;]/)
                .map(function (s) { return s.trim(); })
                .filter(Boolean);
            return parts.some(function (r) {
                return /instructor|contentdeveloper|faculty|administrator|TeachingAssistant|teachingassistant|urn:lti:instrole:ims\/lis\/instructor|urn:lti:role:ims\/lis\/instructor|urn:lti:sysrole:ims\/lis\/teaching|urn:lti:role:ims\/lis\/TeachingAssistant/i.test(r);
            });
        };
        LtiController_1.prototype.handleLti11Launch = function (req, res, body) {
            return __awaiter(this, void 0, void 0, function () {
                var launchUrl, msg, extracted, msg, sess, appBase, returnPath;
                return __generator(this, function (_a) {
                    try {
                        launchUrl = this.buildLaunchUrl(req);
                    }
                    catch (err) {
                        msg = err instanceof Error ? err.message : String(err);
                        (0, lti_debug_1.log)('launch_error', { error: msg, path: 'lti11' });
                        return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent(msg))];
                    }
                    try {
                        extracted = this.lti11Verify.verifyAndExtract(body, launchUrl);
                    }
                    catch (err) {
                        msg = err instanceof Error ? err.message : String(err);
                        (0, lti_debug_1.log)('launch_error', { error: msg, path: 'lti11' });
                        return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent(msg))];
                    }
                    if (!this.lti11RolesAllowInstructor(extracted.roles)) {
                        return [2 /*return*/, res.redirect('/?error=' +
                                encodeURIComponent('Access Denied: Only instructors can use this tool.'))];
                    }
                    sess = req.session;
                    sess.ltiVerified = true;
                    sess.ltiLaunchType = '1.1';
                    sess.courseId = extracted.courseId;
                    sess.ltiSub = extracted.ltiSub || '';
                    delete sess.ltiClientId;
                    sess.canvasApiDomain = extracted.canvasApiDomain;
                    (0, lti_debug_1.log)('lti11_session_set', {
                        ltiLaunchType: '1.1',
                        courseId: extracted.courseId,
                        canvasApiDomain: sess.canvasApiDomain,
                        consumerKey: extracted.consumerKey,
                        ltiClientId_deleted: true,
                    });
                    (0, lti_debug_1.log)('launch_success', {
                        path: 'lti11',
                        courseId: extracted.courseId,
                        canvasApiDomain: sess.canvasApiDomain,
                        consumerKey: extracted.consumerKey,
                    });
                    appBase = (this.config.get('APP_URL') || '').replace(/\/$/, '') || '';
                    returnPath = (appBase ? "".concat(appBase, "/") : '/') +
                        '?courseId=' +
                        encodeURIComponent(extracted.courseId || '');
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            sess.save(function (err) {
                                if (err) {
                                    reject(err instanceof Error ? err : new Error((0, lti_debug_1.unknownToErrorMessage)(err)));
                                    return;
                                }
                                res.redirect(returnPath);
                                resolve();
                            });
                        })];
                });
            });
        };
        return LtiController_1;
    }());
    __setFunctionName(_classThis, "LtiController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getJwks_decorators = [(0, common_1.Get)('jwks')];
        _debug_decorators = [(0, common_1.Get)('debug')];
        _login_decorators = [(0, common_1.All)('login')];
        _launch_decorators = [(0, common_1.Post)('launch')];
        __esDecorate(_classThis, null, _getJwks_decorators, { kind: "method", name: "getJwks", static: false, private: false, access: { has: function (obj) { return "getJwks" in obj; }, get: function (obj) { return obj.getJwks; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _debug_decorators, { kind: "method", name: "debug", static: false, private: false, access: { has: function (obj) { return "debug" in obj; }, get: function (obj) { return obj.debug; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: function (obj) { return "login" in obj; }, get: function (obj) { return obj.login; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _launch_decorators, { kind: "method", name: "launch", static: false, private: false, access: { has: function (obj) { return "launch" in obj; }, get: function (obj) { return obj.launch; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LtiController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LtiController = _classThis;
}();
exports.LtiController = LtiController;

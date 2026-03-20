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
exports.LtiController = void 0;
var common_1 = require("@nestjs/common");
var jwks_service_1 = require("./jwks.service");
var config_1 = require("@nestjs/config");
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var path_1 = require("path");
var launch_verify_service_1 = require("./launch.verify.service");
var platform_service_1 = require("./platform.service");
var state_store_1 = require("./state.store");
var lti_debug_1 = require("./lti.debug");
var LtiController = /** @class */ (function () {
    function LtiController(config, launchVerify, platform, jwksService) {
        this.config = config;
        this.launchVerify = launchVerify;
        this.platform = platform;
        this.jwksService = jwksService;
    }
    LtiController.prototype.getJwks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.jwksService.getJwksJson()];
            });
        });
    };
    LtiController.prototype.debug = function (error, res) {
        return __awaiter(this, void 0, void 0, function () {
            var log, err;
            return __generator(this, function (_a) {
                log = (0, lti_debug_1.getLog)();
                err = error ? decodeURIComponent(error) : null;
                try {
                    (0, fs_1.writeFileSync)((0, path_1.join)(process.cwd(), 'lti-debug-output.json'), JSON.stringify({ error: err, log: log, ts: new Date().toISOString() }, null, 2));
                }
                catch (_) { }
                return [2 /*return*/, res.render('lti-debug', { log: log, error: err })];
            });
        });
    };
    LtiController.prototype.login = function (qIss, qLoginHint, qTargetLinkUri, qClientId, qLtiMessageHint, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var iss, loginHint, targetLinkUri, clientId, ltiMessageHint, expectedClientId, state, nonce, target, authUrl, redirectUri, params, redirect, err_1, msg;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 2, , 3]);
                        iss = qIss || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.iss);
                        loginHint = qLoginHint || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.login_hint);
                        targetLinkUri = qTargetLinkUri || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.target_link_uri);
                        clientId = qClientId || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.client_id);
                        ltiMessageHint = qLtiMessageHint || ((_e = req.body) === null || _e === void 0 ? void 0 : _e.lti_message_hint);
                        (0, lti_debug_1.log)('login_received', { method: req.method, iss: iss, loginHint: loginHint ? '[present]' : null, targetLinkUri: targetLinkUri || null, clientId: clientId, ltiMessageHint: ltiMessageHint ? '[present]' : null });
                        if (!iss || !loginHint || !clientId) {
                            (0, lti_debug_1.log)('login_error', { error: 'Missing OIDC params', hasIss: !!iss, hasLoginHint: !!loginHint, hasClientId: !!clientId });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Missing OIDC params'))];
                        }
                        expectedClientId = this.config.get('LTI_CLIENT_ID');
                        if (expectedClientId && clientId !== expectedClientId) {
                            (0, lti_debug_1.log)('login_error', { error: 'Invalid client_id', received: clientId, expected: expectedClientId });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid client_id'))];
                        }
                        state = (0, crypto_1.randomBytes)(16).toString('hex');
                        nonce = (0, crypto_1.randomBytes)(16).toString('hex');
                        target = targetLinkUri || this.config.get('APP_URL') || '/';
                        (0, state_store_1.setState)(state, target, nonce);
                        return [4 /*yield*/, this.platform.getOidcAuthUrl(iss)];
                    case 1:
                        authUrl = _f.sent();
                        redirectUri = (this.config.get('APP_URL') || 'http://localhost:3000').replace(/\/$/, '') + '/lti/launch';
                        (0, lti_debug_1.log)('login_redirect', { state: state.slice(0, 8) + '...', target: target, redirectUri: redirectUri });
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
                        err_1 = _f.sent();
                        msg = err_1 instanceof Error ? err_1.message : String(err_1);
                        (0, lti_debug_1.log)('login_error', { error: msg });
                        return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent(msg))];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LtiController.prototype.launch = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var idToken, state, stored, claims, err_2, context, custom, roles, courseId, isInstructor, sess, aud, rawDomain;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        idToken = (typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.id_token) === 'string' && req.body.id_token) || null;
                        state = (typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.state) === 'string' && req.body.state) || null;
                        (0, lti_debug_1.log)('launch_received', { hasIdToken: !!idToken, hasState: !!state, statePreview: state ? state.slice(0, 8) + '...' : null });
                        if (!idToken || !state) {
                            (0, lti_debug_1.log)('launch_error', { error: 'Missing id_token or state' });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Missing id_token or state'))];
                        }
                        stored = (0, state_store_1.getState)(state);
                        if (!stored) {
                            (0, lti_debug_1.log)('launch_error', { error: 'Invalid or expired state', statePreview: state.slice(0, 8) + '...' });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid or expired state'))];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.launchVerify.verify(idToken)];
                    case 2:
                        claims = _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _c.sent();
                        (0, lti_debug_1.log)('launch_error', { error: String(err_2 instanceof Error ? err_2.message : err_2) });
                        return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent(String(err_2 instanceof Error ? err_2.message : err_2)))];
                    case 4:
                        if (claims.nonce && claims.nonce !== stored.nonce) {
                            (0, lti_debug_1.log)('launch_error', { error: 'Nonce mismatch' });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('Nonce mismatch'))];
                        }
                        context = claims['https://purl.imsglobal.org/spec/lti/claim/context'];
                        custom = claims['https://purl.imsglobal.org/spec/lti/claim/custom'] || {};
                        roles = claims['https://purl.imsglobal.org/spec/lti/claim/roles'] || [];
                        courseId = String((context === null || context === void 0 ? void 0 : context.id) || custom.custom_canvas_course_id || custom.canvas_course_id || '');
                        isInstructor = roles.some(function (r) {
                            return /instructor|contentdeveloper|urn:lti:sysrole:ims\/lis\/teaching/i.test(r);
                        });
                        if (!isInstructor) {
                            return [2 /*return*/, res.redirect('/?error=' + encodeURIComponent('Access Denied: Only instructors can use this tool.'))];
                        }
                        sess = req.session;
                        sess.ltiVerified = true;
                        sess.courseId = courseId;
                        sess.ltiSub = String(claims.sub || '');
                        aud = claims.aud;
                        sess.ltiClientId = Array.isArray(aud) ? String(aud[0] || '') : String(aud || '');
                        rawDomain = custom.custom_canvas_api_domain ||
                            custom.canvas_api_domain ||
                            this.issToApiDomain(String(claims.iss || ''));
                        sess.canvasApiDomain = rawDomain.startsWith('http')
                            ? rawDomain
                            : 'https://' + rawDomain.replace(/^\/+|\/+$/g, '');
                        (0, lti_debug_1.log)('launch_success', { courseId: courseId, canvasApiDomain: sess.canvasApiDomain, ltiClientId: sess.ltiClientId });
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                sess.save(function (err) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    var returnPath = (stored.target || '/').replace(/\/$/, '') + '/?courseId=' + encodeURIComponent(courseId);
                                    res.redirect('/oauth/canvas?returnUrl=' + encodeURIComponent(returnPath));
                                    resolve();
                                });
                            })];
                }
            });
        });
    };
    LtiController.prototype.issToApiDomain = function (iss) {
        var u = iss.replace(/\/$/, '');
        if (u.includes('canvas.instructure.com'))
            return 'https://canvas.instructure.com';
        return u;
    };
    __decorate([
        (0, common_1.Get)('jwks'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], LtiController.prototype, "getJwks", null);
    __decorate([
        (0, common_1.Get)('debug'),
        __param(0, (0, common_1.Query)('error')),
        __param(1, (0, common_1.Res)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, Object]),
        __metadata("design:returntype", Promise)
    ], LtiController.prototype, "debug", null);
    __decorate([
        (0, common_1.All)('login'),
        __param(0, (0, common_1.Query)('iss')),
        __param(1, (0, common_1.Query)('login_hint')),
        __param(2, (0, common_1.Query)('target_link_uri')),
        __param(3, (0, common_1.Query)('client_id')),
        __param(4, (0, common_1.Query)('lti_message_hint')),
        __param(5, (0, common_1.Req)()),
        __param(6, (0, common_1.Res)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String, String, String, String, Object, Object]),
        __metadata("design:returntype", Promise)
    ], LtiController.prototype, "login", null);
    __decorate([
        (0, common_1.Post)('launch'),
        __param(0, (0, common_1.Req)()),
        __param(1, (0, common_1.Res)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], LtiController.prototype, "launch", null);
    LtiController = __decorate([
        (0, common_1.Controller)('lti'),
        __metadata("design:paramtypes", [config_1.ConfigService,
            launch_verify_service_1.LaunchVerifyService,
            platform_service_1.PlatformService,
            jwks_service_1.JwksService])
    ], LtiController);
    return LtiController;
}());
exports.LtiController = LtiController;

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
exports.OAuthController = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var crypto_1 = require("crypto");
var oauth_state_store_1 = require("./oauth-state.store");
var lti_debug_1 = require("./lti.debug");
var OAuthController = /** @class */ (function () {
    function OAuthController(config) {
        this.config = config;
    }
    OAuthController.prototype.canvasAuth = function (req, res) {
        var sess = req.session;
        if (!sess.ltiVerified || !sess.canvasApiDomain) {
            (0, lti_debug_1.log)('oauth_error', { error: 'Launch via LTI first' });
            return res.redirect('/lti/debug?error=' + encodeURIComponent('Launch via LTI first'));
        }
        var apiKeyClientId = this.config.get('CANVAS_OAUTH_CLIENT_ID');
        var clientId = (apiKeyClientId && apiKeyClientId !== 'your_canvas_oauth_client_id' ? apiKeyClientId : null) ||
            sess.ltiClientId ||
            this.config.get('LTI_CLIENT_ID');
        var appUrl = this.config.get('APP_URL') || 'http://localhost:3000';
        if (!clientId) {
            (0, lti_debug_1.log)('oauth_error', { error: 'OAuth client ID not configured' });
            return res.redirect('/lti/debug?error=' + encodeURIComponent('OAuth client ID not configured'));
        }
        var state = (0, crypto_1.randomBytes)(16).toString('hex');
        var returnUrl = req.query.returnUrl || '/';
        (0, oauth_state_store_1.setOAuthState)(state, returnUrl);
        var base = String(sess.canvasApiDomain).replace(/\/$/, '').replace(/\/api\/v1\/?$/, '');
        var redirectUri = "".concat(appUrl.replace(/\/$/, ''), "/oauth/canvas/callback");
        (0, lti_debug_1.log)('oauth_redirect', { clientId: clientId, source: apiKeyClientId && apiKeyClientId !== 'your_canvas_oauth_client_id' ? 'API_KEY' : 'LTI', canvasBase: base, redirectUri: redirectUri });
        var forceConsent = req.query.retry === '1';
        var authUrl = "".concat(base, "/login/oauth2/auth") +
            "?client_id=".concat(encodeURIComponent(clientId)) +
            "&response_type=code" +
            "&redirect_uri=".concat(encodeURIComponent(redirectUri)) +
            "&state=".concat(encodeURIComponent(state)) +
            (forceConsent ? '' : "&prompt=none");
        return res.redirect(authUrl);
    };
    OAuthController.prototype.canvasCallback = function (code, state, oauthError, oauthErrorDesc, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var returnUrl_1, returnUrl, sess, apiKeyClientId, clientId, secretsJson, secretsMap, clientSecret, appUrl, base, redirectUri, tokenUrl, body, tokenRes, errText, data, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, lti_debug_1.log)('oauth_callback', { hasCode: !!code, hasState: !!state, oauthError: oauthError || null, oauthErrorDesc: oauthErrorDesc || null });
                        if (oauthError) {
                            returnUrl_1 = (0, oauth_state_store_1.getOAuthState)(state);
                            if ((oauthError === 'interaction_required' || oauthError === 'login_required') && returnUrl_1) {
                                return [2 /*return*/, res.redirect("/oauth/canvas?returnUrl=".concat(encodeURIComponent(returnUrl_1), "&retry=1"))];
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
                        apiKeyClientId = this.config.get('CANVAS_OAUTH_CLIENT_ID');
                        clientId = (apiKeyClientId && apiKeyClientId !== 'your_canvas_oauth_client_id' ? apiKeyClientId : null) ||
                            sess.ltiClientId ||
                            this.config.get('LTI_CLIENT_ID');
                        secretsJson = this.config.get('CANVAS_OAUTH_CLIENT_SECRETS');
                        secretsMap = secretsJson ? (function () { try {
                            return JSON.parse(secretsJson);
                        }
                        catch (_a) {
                            return null;
                        } })() : null;
                        clientSecret = (secretsMap && clientId && secretsMap[clientId]) || this.config.get('CANVAS_OAUTH_CLIENT_SECRET');
                        appUrl = this.config.get('APP_URL') || 'http://localhost:3000';
                        if (!clientId || !clientSecret) {
                            (0, lti_debug_1.log)('oauth_error', { error: 'OAuth not configured', hasClientId: !!clientId, hasClientSecret: !!clientSecret });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('OAuth not configured'))];
                        }
                        base = String(sess.canvasApiDomain).replace(/\/$/, '').replace(/\/api\/v1\/?$/, '');
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
                        tokenRes = _a.sent();
                        if (!!tokenRes.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, tokenRes.text()];
                    case 2:
                        errText = _a.sent();
                        (0, lti_debug_1.log)('oauth_error', { error: 'Token exchange failed', status: tokenRes.status, body: errText });
                        return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent("Canvas OAuth token exchange failed: ".concat(tokenRes.status, " - ").concat(errText)))];
                    case 3: return [4 /*yield*/, tokenRes.json()];
                    case 4:
                        data = (_a.sent());
                        token = data === null || data === void 0 ? void 0 : data.access_token;
                        if (!token) {
                            (0, lti_debug_1.log)('oauth_error', { error: 'No access_token in Canvas response' });
                            return [2 /*return*/, res.redirect('/lti/debug?error=' + encodeURIComponent('No access_token in Canvas response'))];
                        }
                        (0, lti_debug_1.log)('oauth_success', { canvasUrl: "".concat(base, "/api/v1") });
                        sess.canvasToken = token;
                        sess.canvasUrl = "".concat(base, "/api/v1");
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                sess.save(function (err) {
                                    if (err) {
                                        reject(err);
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
    __decorate([
        (0, common_1.Get)('canvas'),
        __param(0, (0, common_1.Req)()),
        __param(1, (0, common_1.Res)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", void 0)
    ], OAuthController.prototype, "canvasAuth", null);
    __decorate([
        (0, common_1.Get)('canvas/callback'),
        __param(0, (0, common_1.Query)('code')),
        __param(1, (0, common_1.Query)('state')),
        __param(2, (0, common_1.Query)('error')),
        __param(3, (0, common_1.Query)('error_description')),
        __param(4, (0, common_1.Req)()),
        __param(5, (0, common_1.Res)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
        __metadata("design:returntype", Promise)
    ], OAuthController.prototype, "canvasCallback", null);
    OAuthController = __decorate([
        (0, common_1.Controller)('oauth'),
        __metadata("design:paramtypes", [config_1.ConfigService])
    ], OAuthController);
    return OAuthController;
}());
exports.OAuthController = OAuthController;

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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lti11LaunchVerifyService = void 0;
/* eslint-disable @typescript-eslint/no-require-imports */
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var oauthGenerate = require('oauth-signature').generate;
var Lti11LaunchVerifyService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var Lti11LaunchVerifyService = _classThis = /** @class */ (function () {
        function Lti11LaunchVerifyService_1(config) {
            this.config = config;
        }
        Lti11LaunchVerifyService_1.prototype.verifyAndExtract = function (body, launchUrl) {
            var _a, _b, _c;
            var params = this.flattenBody(body);
            var receivedSig = params.oauth_signature;
            if (!receivedSig) {
                throw new Error('Missing oauth_signature');
            }
            var oauth_signature = params.oauth_signature, signParams = __rest(params, ["oauth_signature"]);
            void oauth_signature;
            var method = (signParams.oauth_signature_method || 'HMAC-SHA1').toUpperCase();
            if (method !== 'HMAC-SHA1') {
                throw new Error("Unsupported oauth_signature_method: ".concat(method));
            }
            var ts = parseInt(signParams.oauth_timestamp || '0', 10);
            if (!ts || Number.isNaN(ts)) {
                throw new Error('Invalid oauth_timestamp');
            }
            var skewSec = 600;
            if (Math.abs(Math.floor(Date.now() / 1000) - ts) > skewSec) {
                throw new Error('oauth_timestamp out of range');
            }
            var consumerKey = signParams.oauth_consumer_key;
            if (!consumerKey) {
                throw new Error('Missing oauth_consumer_key');
            }
            var secret = this.resolveSecret(consumerKey);
            var expectedRaw = oauthGenerate('POST', launchUrl, signParams, secret, '', {
                encodeSignature: false,
            });
            var a = Buffer.from(expectedRaw, 'utf8');
            var b = Buffer.from(receivedSig, 'utf8');
            if (a.length !== b.length || !(0, crypto_1.timingSafeEqual)(a, b)) {
                throw new Error('Invalid OAuth 1.0a signature');
            }
            var courseId = String(signParams.custom_canvas_course_id ||
                signParams.canvas_course_id ||
                signParams.context_id ||
                '').trim();
            var rawDomain = ((_a = signParams.custom_canvas_api_base_url) === null || _a === void 0 ? void 0 : _a.trim()) ||
                ((_b = signParams.custom_canvas_domain) === null || _b === void 0 ? void 0 : _b.trim()) ||
                ((_c = signParams.tool_consumer_instance_url) === null || _c === void 0 ? void 0 : _c.trim()) ||
                '';
            if (!rawDomain) {
                throw new Error('Missing Canvas host (add custom_canvas_api_base_url / custom_canvas_domain to the tool XML, or rely on tool_consumer_instance_url)');
            }
            var canvasApiDomain = rawDomain.startsWith('http')
                ? rawDomain.replace(/\/+$/, '')
                : "https://".concat(rawDomain.replace(/^\/+|\/+$/g, ''));
            var roles = signParams.roles || '';
            var ltiSub = String(signParams.user_id || signParams.lis_person_sourcedid || '').trim();
            return {
                courseId: courseId,
                canvasApiDomain: canvasApiDomain,
                roles: roles,
                ltiSub: ltiSub,
                consumerKey: consumerKey,
            };
        };
        Lti11LaunchVerifyService_1.prototype.flattenBody = function (body) {
            var out = {};
            for (var _i = 0, _a = Object.entries(body); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                if (value === undefined || value === null)
                    continue;
                var s = Array.isArray(value)
                    ? String(value[0])
                    : String(value);
                out[key] = s;
            }
            return out;
        };
        Lti11LaunchVerifyService_1.prototype.envTrim = function (key) {
            var _a;
            var v = (_a = this.config.get(key)) !== null && _a !== void 0 ? _a : process.env[key];
            if (v == null)
                return undefined;
            var t = String(v)
                .trim()
                .replace(/^\uFEFF/, '');
            return t === '' ? undefined : t;
        };
        Lti11LaunchVerifyService_1.prototype.resolveSecret = function (consumerKey) {
            var _a, _b, _c, _d, _e, _f, _g;
            var mapJsonRaw = (_a = this.config.get('LTI11_SECRETS_JSON')) !== null && _a !== void 0 ? _a : process.env['LTI11_SECRETS_JSON'];
            var mapJson = mapJsonRaw === null || mapJsonRaw === void 0 ? void 0 : mapJsonRaw.trim();
            if (mapJson) {
                var map = void 0;
                try {
                    map = JSON.parse(mapJson);
                }
                catch (_h) {
                    throw new Error('LTI11_SECRETS_JSON is not valid JSON');
                }
                var s = map[consumerKey];
                if (s != null && String(s).trim() !== '') {
                    return String(s)
                        .trim()
                        .replace(/^\uFEFF/, '');
                }
                throw new Error("LTI11_SECRETS_JSON has no entry for oauth_consumer_key \"".concat(consumerKey, "\". ") +
                    "Add {\"".concat(consumerKey, "\":\"<shared-secret>\"} or remove LTI11_SECRETS_JSON and set LTI11_SHARED_SECRET instead."));
            }
            var single = (_d = (_c = (_b = this.envTrim('LTI11_SHARED_SECRET')) !== null && _b !== void 0 ? _b : this.envTrim('LTI_1_1_SHARED_SECRET')) !== null && _c !== void 0 ? _c : this.envTrim('LTI1_SHARED_SECRET')) !== null && _d !== void 0 ? _d : this.envTrim('LTI_SHARED_SECRET');
            if (!single) {
                throw new Error('No LTI 1.1 shared secret found. Set LTI11_SHARED_SECRET (preferred), LTI_1_1_SHARED_SECRET, LTI1_SHARED_SECRET, or LTI_SHARED_SECRET ' +
                    'to the Canvas tool Shared Secret. If you use LTI11_SECRETS_JSON it must include this consumer key. ' +
                    "Canvas sent oauth_consumer_key=\"".concat(consumerKey, "\"."));
            }
            var expectedKey = (_g = (_f = (_e = this.envTrim('LTI11_CONSUMER_KEY')) !== null && _e !== void 0 ? _e : this.envTrim('LTI_1_1_CONSUMER_KEY')) !== null && _f !== void 0 ? _f : this.envTrim('LTI1_CONSUMER_KEY')) !== null && _g !== void 0 ? _g : this.envTrim('LTI_CONSUMER_KEY');
            if (expectedKey && expectedKey !== consumerKey) {
                throw new Error('oauth_consumer_key does not match LTI11_CONSUMER_KEY');
            }
            return single;
        };
        return Lti11LaunchVerifyService_1;
    }());
    __setFunctionName(_classThis, "Lti11LaunchVerifyService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Lti11LaunchVerifyService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Lti11LaunchVerifyService = _classThis;
}();
exports.Lti11LaunchVerifyService = Lti11LaunchVerifyService;

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
var common_1 = require("@nestjs/common");
var deployment_mode_1 = require("./deployment-mode");
var AuthGuard = /** @class */ (function () {
    function AuthGuard() {
    }
    AuthGuard.prototype.canActivate = function (context) {
        var req = context.switchToHttp().getRequest();
        var mode = (0, deployment_mode_1.getDeploymentMode)(req);
        switch (mode) {
            case deployment_mode_1.DeploymentMode.LOCAL:
                return this.validateLocalAccess(req);
            case deployment_mode_1.DeploymentMode.RENDER:
                return this.validateRenderAccess(req);
            case deployment_mode_1.DeploymentMode.LTI:
                return this.validateLtiAccess(req);
            default:
                throw new common_1.ForbiddenException('Unknown deployment mode');
        }
    };
    AuthGuard.prototype.validateLocalAccess = function (req) {
        // For local development, automatically populate session with .env credentials
        if (!req.session.canvasToken && process.env.CANVAS_TOKEN) {
            req.session.canvasToken = process.env.CANVAS_TOKEN;
            req.session.canvasUrl = (0, deployment_mode_1.getDefaultCanvasUrl)();
        }
        return true;
    };
    AuthGuard.prototype.validateRenderAccess = function (req) {
        // For Render deployment, require manual login
        var hasToken = !!req.session.canvasToken;
        var hasUrl = !!req.session.canvasUrl;
        if (!hasToken || !hasUrl) {
            // Store the current path so we can redirect back after login
            req.session.returnUrl = req.originalUrl;
            return false;
        }
        return true;
    };
    AuthGuard.prototype.validateLtiAccess = function (req) {
        // For LTI deployment, validate LTI verification
        return !!req.session.ltiVerified;
    };
    AuthGuard = __decorate([
        (0, common_1.Injectable)()
    ], AuthGuard);
    return AuthGuard;
}());
exports.AuthGuard = AuthGuard;

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LtiModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var lti_controller_1 = require("./lti.controller");
var oauth_controller_1 = require("./oauth.controller");
var jwks_service_1 = require("./jwks.service");
var launch_verify_service_1 = require("./launch.verify.service");
var platform_service_1 = require("./platform.service");
var LtiModule = /** @class */ (function () {
    function LtiModule() {
    }
    LtiModule = __decorate([
        (0, common_1.Module)({
            imports: [config_1.ConfigModule],
            controllers: [lti_controller_1.LtiController, oauth_controller_1.OAuthController],
            providers: [jwks_service_1.JwksService, launch_verify_service_1.LaunchVerifyService, platform_service_1.PlatformService],
            exports: [],
        })
    ], LtiModule);
    return LtiModule;
}());
exports.LtiModule = LtiModule;

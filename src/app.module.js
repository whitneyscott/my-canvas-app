"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var app_controller_1 = require("./app/app.controller");
var canvas_controller_1 = require("./canvas/canvas.controller");
var canvas_service_1 = require("./canvas/canvas.service");
var college_scorecard_controller_1 = require("./college-scorecard/college-scorecard.controller");
var college_scorecard_service_1 = require("./college-scorecard/college-scorecard.service");
var automated_test_module_1 = require("./automated-test/automated-test.module");
var auth_module_1 = require("./auth/auth.module");
var lti_module_1 = require("./lti/lti.module");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                    expandVariables: true
                }),
                auth_module_1.AuthModule,
                automated_test_module_1.AutomatedTestModule,
                lti_module_1.LtiModule,
            ],
            controllers: [app_controller_1.AppController, canvas_controller_1.CanvasController, college_scorecard_controller_1.CollegeScorecardController],
            providers: [canvas_service_1.CanvasService, college_scorecard_service_1.CollegeScorecardService],
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;

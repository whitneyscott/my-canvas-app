"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentMode = void 0;
exports.getDeploymentMode = getDeploymentMode;
exports.getDefaultCanvasUrl = getDefaultCanvasUrl;
var DeploymentMode;
(function (DeploymentMode) {
    DeploymentMode["LOCAL"] = "local";
    DeploymentMode["RENDER"] = "render";
    DeploymentMode["LTI"] = "lti";
})(DeploymentMode || (exports.DeploymentMode = DeploymentMode = {}));
function getDeploymentMode(req) {
    var _a, _b, _c, _d;
    // LTI: Check for LTI parameters in request body or query
    if (((_a = req.body) === null || _a === void 0 ? void 0 : _a.custom_canvas_course_id) ||
        ((_b = req.query) === null || _b === void 0 ? void 0 : _b.custom_canvas_course_id) ||
        ((_c = req.body) === null || _c === void 0 ? void 0 : _c.roles) ||
        ((_d = req.query) === null || _d === void 0 ? void 0 : _d.roles)) {
        return DeploymentMode.LTI;
    }
    // Render: Check for production environment OR no .env file access
    // In Render, we don't want to use .env file credentials
    if (process.env.NODE_ENV === 'production' ||
        process.env.RENDER ||
        req.get('x-render') ||
        !process.env.CANVAS_TOKEN) {
        return DeploymentMode.RENDER;
    }
    // Local: Development environment with .env file
    return DeploymentMode.LOCAL;
}
function getDefaultCanvasUrl() {
    return process.env.CANVAS_BASE_URL || 'https://tjc.instructure.com/api/v1';
}

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { DeploymentMode, getDeploymentMode, getDefaultCanvasUrl } from './deployment-mode';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const mode = getDeploymentMode(req);
    
    switch (mode) {
      case DeploymentMode.LOCAL:
        return this.validateLocalAccess(req);
      case DeploymentMode.RENDER:
        return this.validateRenderAccess(req);
      case DeploymentMode.LTI:
        return this.validateLtiAccess(req);
      default:
        throw new ForbiddenException('Unknown deployment mode');
    }
  }
  
  private validateLocalAccess(req: Request): boolean {
    // For local development, automatically populate session with .env credentials
    if (!req.session.canvasToken && process.env.CANVAS_TOKEN) {
      req.session.canvasToken = process.env.CANVAS_TOKEN;
      req.session.canvasUrl = getDefaultCanvasUrl();
    }
    return true;
  }
  
  private validateRenderAccess(req: Request): boolean {
    // For Render deployment, require manual login
    const hasToken = !!req.session.canvasToken;
    const hasUrl = !!req.session.canvasUrl;
    
    if (!hasToken || !hasUrl) {
      // Store the current path so we can redirect back after login
      req.session.returnUrl = req.originalUrl;
      return false;
    }
    return true;
  }
  
  private validateLtiAccess(req: Request): boolean {
    // For LTI deployment, validate LTI verification
    return !!req.session.ltiVerified;
  }
}
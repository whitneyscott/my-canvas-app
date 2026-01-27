import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeploymentMode, getDeploymentMode, getDefaultCanvasUrl } from './deployment-mode';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  async validateCanvasToken(token: string, baseUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/users/self`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  getDeploymentMode(req: any): DeploymentMode {
    return getDeploymentMode(req);
  }

  getAuthStatus(req: any): { needsToken: boolean; mode: DeploymentMode; defaultUrl: string } {
    const mode = this.getDeploymentMode(req);
    let needsToken = false;

    switch (mode) {
      case DeploymentMode.LOCAL:
        // Local: auto-populate from .env, no token needed
        needsToken = false;
        break;
      case DeploymentMode.RENDER:
        // Render: require manual login
        needsToken = !req.session.canvasToken || !req.session.canvasUrl;
        break;
      case DeploymentMode.LTI:
        // LTI: use LTI verification
        needsToken = !req.session.ltiVerified;
        break;
    }

    return {
      needsToken,
      mode,
      defaultUrl: getDefaultCanvasUrl()
    };
  }

  async setToken(req: any, token: string, baseUrl: string): Promise<{ success: boolean; message?: string }> {
    const mode = this.getDeploymentMode(req);

    if (mode !== DeploymentMode.RENDER) {
      throw new BadRequestException('Token setting only allowed in Render mode');
    }

    // Validate the token before storing
    const isValid = await this.validateCanvasToken(token, baseUrl);
    
    if (!isValid) {
      return { success: false, message: 'Invalid Canvas API token' };
    }

    req.session.canvasToken = token;
    req.session.canvasUrl = baseUrl.replace(/\/+$/, "");
    
    return new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          resolve({ success: false, message: 'Failed to save session' });
        }
        resolve({ success: true });
      });
    });
  }

  setLtiSession(req: any, courseId: string): void {
    req.session.ltiVerified = true;
    req.session.courseId = courseId;
  }
}
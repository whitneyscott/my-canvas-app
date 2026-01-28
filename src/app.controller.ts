// Re-export the controller implementation from src/app/app.controller.ts
export { AppController } from './app/app.controller';
// This file intentionally forwards the named export so existing imports
// that reference './app.controller' continue to work while the
// canonical implementation lives under src/app/app.controller.ts
// (avoids duplicate-class issues and keeps runtime mappings consistent).

    if (deploymentMode === 'local') {
      return {
        courseId: courseId || null,
        deploymentMode: 'local',
        autoLoad: true,
        canvasUrl: process.env.CANVAS_BASE_URL || 'https://tjc.instructure.com/api/v1',
        canvasToken: process.env.CANVAS_TOKEN || null
      };
    }

    const hasValidSession = req?.session?.canvasToken && req?.session?.canvasUrl;
    return {
      courseId: courseId || req?.session?.courseId || null,
      deploymentMode: 'render',
      autoLoad: hasValidSession,
      showLoginModal: !hasValidSession,
      canvasUrl: req?.session?.canvasUrl || 'https://tjc.instructure.com/api/v1',
      canvasToken: req?.session?.canvasToken || null
    };
  }

  private getDeploymentMode(req: any): string {
    if (req?.body?.custom_canvas_course_id || req?.query?.custom_canvas_course_id) return 'lti';
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) return 'render';
    return 'local';
  }

  @Post(['lti/launch', 'lti-launch'])
  async handleLtiLaunch(@Req() req: any, @Res() res: Response) {
    console.log('LTI Launch Triggered: Reconstructing Signature...');
    
    const contentType = (req.get('content-type') || '').toLowerCase();
    let params: Record<string, any> = {};
    
    if (req.rawBody && contentType.includes('application/x-www-form-urlencoded')) {
      params = Object.fromEntries(new URLSearchParams(req.rawBody));
    } else {
      params = { ...req.body };
    }

    const providedSig = params.oauth_signature;
    delete params.oauth_signature;

    const consumerSecret = process.env.LTI_SHARED_SECRET || process.env.LTI_CONSUMER_SECRET;
    if (!consumerSecret) throw new BadRequestException('LTI Secret not configured');

    const method = req.method || 'POST';
    const host = req.get('x-forwarded-host') || req.get('host');
    // Ensure we use https and strip query params for the base string
    const url = `https://${host}${req.originalUrl.split('?')[0]}`;

    const expected = oauthSignature.generate(method, url, params, consumerSecret, undefined, { encodeSignature: false });
    
    if (decodeURIComponent(providedSig) !== expected && providedSig !== expected) {
      console.error('Signature Mismatch!', { expected, provided: providedSig, url });
      return res.status(401).send('Invalid LTI signature');
    }

    const roles = params.roles || '';
    const isInstructor = roles.includes('Instructor') || roles.includes('ContentDeveloper');
    if (!isInstructor) return res.status(403).send('Instructors only.');

    const courseId = params.custom_canvas_course_id;
    this.authService.setLtiSession(req, courseId);
    return res.redirect(`/?courseId=${courseId}`);
  }
}
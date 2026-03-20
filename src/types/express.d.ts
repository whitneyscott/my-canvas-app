import 'express-session';

declare module 'express-session' {
  interface SessionData {
    canvasToken?: string;
    canvasUrl?: string;
    ltiVerified?: boolean;
    courseId?: string;
    canvasApiDomain?: string;
    ltiClientId?: string;
    ltiLaunchType?: '1.1' | '1.3';
    ltiSub?: string;
    returnUrl?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: import('express-session').Session & Partial<import('express-session').SessionData>;
    }
  }
}
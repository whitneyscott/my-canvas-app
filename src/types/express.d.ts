import 'express-session';

declare module 'express-session' {
  interface SessionData {
    canvasToken?: string;
    canvasUrl?: string;
    ltiVerified?: boolean;
    courseId?: string;
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
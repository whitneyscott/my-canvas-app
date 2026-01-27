export enum DeploymentMode {
  LOCAL = 'local',
  RENDER = 'render',
  LTI = 'lti'
}

export function getDeploymentMode(req: any): DeploymentMode {
  // LTI: Check for LTI parameters in request body or query
  if (req.body?.custom_canvas_course_id || 
      req.query?.custom_canvas_course_id ||
      req.body?.roles ||
      req.query?.roles) {
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

export function getDefaultCanvasUrl(): string {
  return process.env.CANVAS_BASE_URL || 'https://instructure.tjc';
}
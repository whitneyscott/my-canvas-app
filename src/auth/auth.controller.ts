import { Controller, Get, Post, Req, Body, Res, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('status')
  getStatus(@Req() req: any) {
    return this.authService.getAuthStatus(req);
  }

  @Post('set-token')
  async setToken(
    @Req() req: any,
    @Body() body: { token: string; canvasUrl: string },
    @Res() res: Response
  ) {
    const result = await this.authService.setToken(req, body.token, body.canvasUrl);
    
    if (result.success) {
      // Redirect back to the original URL or home
      const returnUrl = req.session.returnUrl || '/';
      delete req.session.returnUrl;
      return res.redirect(returnUrl);
    } else {
      return res.status(400).json(result);
    }
  }

  
}
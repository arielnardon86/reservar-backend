import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithPassword(loginDto);
  }

  @Get('callback')
  async callback(@Query('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }
}



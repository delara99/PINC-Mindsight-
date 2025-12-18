import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() req) {
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            return { message: 'Credenciais inválidas' };
        }
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body) {
        return this.authService.register(body);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getMe(@Request() req) {
        return this.authService.getMe(req.user.userId);
    }

    // Reset de senha sem email - validação por dados cadastrais
    @Post('reset-password')
    async resetPassword(@Body() body: {
        email: string;
        name: string;
        phone?: string;
        cnpj?: string;
        newPassword: string;
    }) {
        return this.authService.resetPassword(body);
    }
}

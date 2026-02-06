import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
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

    @Post('login-code')
    async loginCode(@Body() body: { code: string }) {
        const user = await this.authService.loginByAccessCode(body.code);
        if (!user) {
            return { message: 'Código inválido ou inativo.' };
        }
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body) {
        return this.authService.register(body);
    }

    // Google OAuth - Inicia o fluxo
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Request() req) {
        // Guard redireciona para Google
    }

    // Google OAuth - Callback
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Request() req) {
        // req.user contém dados do Google (vem da strategy)
        const result = await this.authService.googleLogin(req.user);

        // Redirecionar para frontend com token
        const frontendUrl = process.env.FRONTEND_URL || 'https://www.pinc.app.br';
        const redirectUrl = `${frontendUrl}/auth/google/success?token=${result.access_token}`;

        return {
            statusCode: 302,
            url: redirectUrl
        };
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getMe(@Request() req) {
        return this.authService.getMe(req.user.userId);
    }

    @Post('logout')
    @UseGuards(AuthGuard('jwt'))
    async logout(@Request() req) {
        return this.authService.logout(req.user.userId);
    }

    // Reset de senha sem email - validação por dados cadastrais
    @Post('reset-password')
    async resetPassword(@Body() body: {
        email: string;
        name: string;
        phone: string;
        cpf?: string;
        cnpj?: string;
        newPassword: string;
    }) {
        return this.authService.resetPassword(body);
    }
    @Get('debug-fail-safe')
    async debugFailSafe(@Query('connectionId') connectionId: string) {
        if (!connectionId) {
            return { error: 'connectionId query parameter required' };
        }
        return this.authService.debugFailSafe(connectionId);
    }

    @Get('ping')
    async ping() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Backend is alive and updated',
            version: 'v2.1-debug-fix'
        };
    }

    @Get('test-comparison')
    async testComparison(@Query('connectionId') connectionId: string) {
        if (!connectionId) {
            return { error: 'connectionId query parameter required' };
        }
        // BYPASS AUTH - APENAS PARA TESTE
        const prisma = this.authService['prisma'];
        const conn = await prisma.connection.findUnique({
            where: { id: connectionId }
        });

        if (!conn) return { error: 'Connection not found' };

        const assessmentsA = await prisma.assessmentAssignment.findMany({
            where: {
                userId: conn.userAId,
                status: { in: ['COMPLETED', 'DELETED'] },
                assessment: { type: 'BIG_FIVE' }
            },
            orderBy: { completedAt: 'desc' },
            take: 1,
            select: { id: true, status: true }
        });

        const assessmentsB = await prisma.assessmentAssignment.findMany({
            where: {
                userId: conn.userBId,
                status: { in: ['COMPLETED', 'DELETED'] },
                assessment: { type: 'BIG_FIVE' }
            },
            orderBy: { completedAt: 'desc' },
            take: 1,
            select: { id: true, status: true }
        });

        return {
            connection: { id: conn.id, userAId: conn.userAId, userBId: conn.userBId },
            foundAssessments: {
                userA: assessmentsA[0] || null,
                userB: assessmentsB[0] || null
            },
            message: assessmentsA.length > 0 && assessmentsB.length > 0
                ? '✅ Both users have assessments - comparison should work!'
                : '❌ Missing assessments - comparison will fail'
        };
    }
}

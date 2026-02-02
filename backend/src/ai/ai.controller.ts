import { Controller, Post, Body, UseGuards, Request, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ai')
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly prisma: PrismaService
    ) { }

    @Get('history')
    @UseGuards(AuthGuard('jwt'))
    async getHistory(@Request() req, @Query('context') context: string) {
        return this.aiService.getChatHistory(req.user.userId, context || 'GENERAL');
    }

    @Post('chat')
    @UseGuards(AuthGuard('jwt'))
    async chat(@Request() req, @Body() body: { message: string, history: any[], profileContext: any, context?: string }) {
        // Pegar o usuario do token (req.user)
        const tokenUser = req.user;

        if (!tokenUser) {
            throw new HttpException('Usuário não autenticado', HttpStatus.UNAUTHORIZED);
        }

        // BUSCAR DADOS REAIS NO BANCO (Single Source of Truth)
        // O token pode estar desatualizado, então buscamos o plano fresco.
        const user = await this.prisma.user.findUnique({
            where: { id: tokenUser.userId },
            select: { plan: true, role: true }
        });

        if (!user) {
            throw new HttpException('Usuário não encontrado no banco', HttpStatus.UNAUTHORIZED);
        }

        try {
            const response = await this.aiService.generateChatResponse(
                tokenUser.userId, // Passando ID para persistência
                body.profileContext || { name: tokenUser.name }, // Contexto do perfil (scores)
                body.history || [], // Histórico da conversa
                user.plan || 'START', // Plano RECENTE do banco
                body.context || 'GENERAL' // Contexto da conversa (ex: MY_REPORT ou CONNECTION:xyz)
            );

            return { message: response };

        } catch (error) {
            console.error('AI Error:', error);
            throw new HttpException('Erro no processamento da IA', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('support')
    // Endpoint Público (Sem AuthGuard) para a página /help
    async supportChat(@Body() body: { message: string }) {
        if (!body.message) {
            throw new HttpException('Mensagem vazia', HttpStatus.BAD_REQUEST);
        }

        // Simples Rate Limit / Proteção básica poderia ser adicionada aqui
        try {
            const response = await this.aiService.generateSupportResponse(body.message);
            return { message: response };
        } catch (error) {
            throw new HttpException('Erro no suporte IA', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

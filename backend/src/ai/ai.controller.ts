import { Controller, Post, Body, UseGuards, Request, HttpException, HttpStatus, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt')) // Protegido: Só usuários logados
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly prisma: PrismaService
    ) { }

    @Get('history')
    async getHistory(@Request() req) {
        return this.aiService.getChatHistory(req.user.userId);
    }

    @Post('chat')
    async chat(@Request() req, @Body() body: { message: string, history: any[], profileContext: any }) {
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
                user.plan || 'START' // Plano RECENTE do banco
            );

            return { message: response };

        } catch (error) {
            console.error('AI Error:', error);
            throw new HttpException('Erro no processamento da IA', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

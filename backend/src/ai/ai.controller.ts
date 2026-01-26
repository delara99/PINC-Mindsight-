
import { Controller, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('ai')
@UseGuards(AuthGuard('jwt')) // Protegido: Só usuários logados
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Request() req, @Body() body: { message: string, history: any[], profileContext: any }) {
        // Pegar o usuario do token (req.user) para validar o plano
        const user = req.user;

        if (!user) {
            throw new HttpException('Usuário não autenticado', HttpStatus.UNAUTHORIZED);
        }

        // Validação extra de segurança: O plano vem do token (mais seguro que do body)
        // Assumindo que o JWT payload tem o campo 'plan' ou 'role'
        // Se não tiver, teremos que buscar no banco, mas por ora vamos confiar no payload do guard

        // Simplificação MVP: Passamos o objeto do usuário completo para o service decidir

        try {
            const response = await this.aiService.generateChatResponse(
                body.profileContext || { name: user.name }, // Contexto do perfil (scores)
                body.history || [], // Histórico da conversa
                user.plan || 'START' // Plano do usuário (START, PRO, BUSINESS)
            );

            return { message: response };

        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

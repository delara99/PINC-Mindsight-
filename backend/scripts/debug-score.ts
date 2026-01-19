
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ScoreCalculationService } from '../src/reports/score-calculation.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const scoreService = app.get(ScoreCalculationService);

    try {
        // 1. Pegar o último assignment completado
        const lastAssignment = await prisma.assessmentAssignment.findFirst({
            where: { status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            include: {
                assessment: true,
                user: true
            }
        });

        if (!lastAssignment) {
            console.log('Nenhum assignment completado encontrado.');
            return;
        }

        console.log('--- Último Assignment Completado ---');
        console.log(`ID: ${lastAssignment.id}`);
        console.log(`Usuário: ${lastAssignment.user.email}`);
        console.log(`Assessment: ${lastAssignment.assessment.title}`);
        console.log(`Data: ${lastAssignment.completedAt}`);

        // 2. Verificar se tem respostas salvas
        const answersCount = await prisma.assessmentResponse.count({
            where: { assignmentId: lastAssignment.id }
        });
        console.log(`Total de respostas salvas no DB: ${answersCount}`);

        if (answersCount === 0) {
            console.error("CRÍTICO: Nenhuma resposta encontrada para este assignment. O salvamento falhou?");
        }

        // Listar algumas respostas para conferir
        if (answersCount > 0) {
            const sampleAnswers = await prisma.assessmentResponse.findMany({
                where: { assignmentId: lastAssignment.id },
                take: 3,
                include: { question: true }
            });
            console.log('Amostra de respostas:', JSON.stringify(sampleAnswers, null, 2));
        }

        // 3. Tentar calcular o score
        console.log('\n--- Tentando Calcular Score ---');
        const scores = await scoreService.calculateScores(lastAssignment.id);

        console.log('Resultado do Cálculo:');
        console.log(JSON.stringify(scores, null, 2));

    } catch (error) {
        console.error('Erro durante o debug:', error);
    } finally {
        await app.close();
    }
}

bootstrap();

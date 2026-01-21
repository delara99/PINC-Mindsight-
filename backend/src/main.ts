import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { execSync } from 'child_process';

async function bootstrap() {
    console.log('🚀 SERVER DEPLOYED - VERSION: COUPONS_FIX_V2');
    // RUNTIME MIGRATION: Força a atualização do banco de dados ao iniciar
    // Isso garante que tabelas novas (como CrossProfileReport) sejam criadas
    // independentemente da configuração de deploy do Railway.
    try {
        console.log('🔄 STARTING RUNTIME MIGRATION (DB PUSH)...');
        // Usamos DB PUSH porque o projeto não possui histórico de migrations commitado
        execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
        console.log('✅ DATABASE SYNCED SUCCESSFULLY.');
    } catch (error) {
        console.error('❌ MIGRATION FAILED (Runtime):', error.message);
        // Continuamos o boot, pois pode ser erro de conexão temporário e o banco já estar atualizado
    }

    const app = await NestFactory.create(AppModule);
    // Enable CORS with specific options to avoid 405/403 issues in production
    app.enableCors({
        origin: [
            'https://pinc.app.br',
            'https://www.pinc.app.br',
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    // Global Prefix
    app.setGlobalPrefix('api/v1');

    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

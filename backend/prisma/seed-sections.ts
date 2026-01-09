
import { PrismaClient, AudienceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding automatic interpretation sections...');

    // Obter tenant (assumindo default ou primeiro)
    const tenant = await prisma.adminTenant.findFirst();
    if (!tenant) {
        console.error("No tenant found. Skipping.");
        return;
    }

    const sections = [
        { code: 'SEC_LOGIC', title: 'Dimensão Lógica vs Sentimento', template: '{{CATEGORY_LOGIC}}', order: 10 },
        { code: 'SEC_ADAPT', title: 'Dimensão Adaptação vs Estrutura', template: '{{CATEGORY_ADAPT}}', order: 11 },
        { code: 'SEC_CONCR', title: 'Dimensão Concreto vs Abstrato', template: '{{CATEGORY_CONCR}}', order: 12 },
        { code: 'SEC_EMOT', title: 'Dimensão Emoção vs Razão', template: '{{CATEGORY_EMOT}}', order: 13 },
        { code: 'SEC_REC', title: 'Recomendações e Plano de Ação', template: '### Plano de Ação Personalizado\n\n{{CATEGORY_REC}}', order: 20 },
    ];

    for (const sec of sections) {
        // Remove existing to avoid duplicates if code is not unique
        await prisma.interpretationSection.deleteMany({
            where: {
                code: sec.code,
                tenantId: tenant.id
            }
        });

        // Create new
        await prisma.interpretationSection.create({
            data: {
                code: sec.code,
                title: sec.title,
                template: sec.template,
                audience: AudienceType.CLIENT,
                displayOrder: sec.order,
                active: true,
                tenantId: tenant.id
            }
        });
        console.log(`Created section ${sec.title}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

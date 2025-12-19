
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'teste4@empresa.com';
    console.log(`🔍 Investigando usuário: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tenant: true,
            assessmentAssignments: {
                include: {
                    assessment: true,
                    config: true
                }
            }
        }
    });

    if (!user) {
        console.log('❌ Usuário não encontrado.');
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.id}`);
    console.log(`🏢 Tenant: ${user.tenant.name} (ID: ${user.tenantId})`);
    console.log(`📅 Criado em: ${user.createdAt}`);

    console.log(`\n📋 Atribuições (${user.assessmentAssignments.length}):`);
    user.assessmentAssignments.forEach(a => {
        console.log(`- [${a.status}] Assessment: "${a.assessment.title}" (ID: ${a.assessmentId})`);
        console.log(`  Assessment Default? ${a.assessment.isDefault}`);
        console.log(`  Tenant do Assessment: ${a.assessment.tenantId}`);
        console.log(`  Criado em: ${a.assignedAt}`);
    });

    console.log('\n🌟 Avaliação Padrão do Tenant:');
    const defaultAssessment = await prisma.assessmentModel.findFirst({
        where: {
            tenantId: user.tenantId,
            isDefault: true
        }
    });

    if (defaultAssessment) {
        console.log(`Encontrada: "${defaultAssessment.title}" (ID: ${defaultAssessment.id})`);
    } else {
        console.log('❌ Nenhuma avaliação padrão definida para este tenant.');
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

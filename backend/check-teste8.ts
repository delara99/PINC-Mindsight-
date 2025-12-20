import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'teste8@empresa.com' }
  });

  if (!user) {
    console.log('❌ Usuário teste8 não encontrado');
    return;
  }

  console.log('✅ Usuário encontrado:', user.id, user.email);

  const assignments = await prisma.assessmentAssignment.findMany({
    where: { userId: user.id },
    include: {
      assessment: { select: { title: true, assessmentType: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n📋 ${assignments.length} assignments encontrados:\n`);

  for (const a of assignments) {
    console.log(`- ${a.assessment.title} (${a.assessment.assessmentType})`);
    console.log(`  Status: ${a.status}`);
    console.log(`  Config: ${a.configId || 'NENHUMA'}`);
    console.log(`  Result: ${(a as any).result ? 'SIM' : 'NÃO'}`);
    console.log(`  Scores: ${(a as any).result?.scores ? Object.keys((a as any).result.scores).length + ' facetas' : 'NENHUM'}`);
    console.log('');
  }
}

main().finally(() => prisma.$disconnect());

// Script para testar cálculo de scores e identificar erros
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testScoreCalculation() {
    console.log('\n🔍 TESTE DE CÁLCULO DE SCORES\n');

    // Buscar último assignment COMPLETED
    const assignment = await prisma.assessmentAssignment.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        include: {
            responses: {
                include: { question: true }
            },
            config: {
                include: {
                    traits: {
                        include: { facets: true }
                    }
                }
            },
            user: { select: { tenantId: true } }
        }
    });

    if (!assignment) {
        console.log('❌ Nenhum assignment COMPLETED encontrado');
        return;
    }

    console.log(`✅ Assignment: ${assignment.id}`);
    console.log(`   User: ${assignment.userId}`);
    console.log(`   Responses: ${assignment.responses.length}`);
    console.log(`   Config: ${assignment.config ? assignment.config.name : 'NENHUMA'}`);

    if (!assignment.config) {
        console.log('\n⚠️  Config não vinculada ao assignment!');

        // Buscar config ativa
        const activeConfig = await prisma.bigFiveConfig.findFirst({
            where: {
                tenantId: assignment.user.tenantId,
                isActive: true
            },
            include: {
                traits: {
                    include: { facets: true }
                }
            }
        });

        if (activeConfig) {
            console.log(`✅ Config ativa encontrada: ${activeConfig.name}`);
            console.log(`   Traços: ${activeConfig.traits.length}`);
        } else {
            console.log('❌ Nenhuma config ativa encontrada!');
            return;
        }
    } else {
        console.log(`   Traços na config: ${assignment.config.traits.length}`);
        assignment.config.traits.forEach(t => {
            console.log(`   - ${t.name}: ${t.facets?.length || 0} facetas`);
        });
    }

    // Testar matching de questões
    console.log('\n📋 MATCHING DE QUESTÕES:');
    const sampleResponses = assignment.responses.slice(0, 5);

    for (const resp of sampleResponses) {
        console.log(`\nQuestão: "${resp.question.text.substring(0, 50)}..."`);
        console.log(`  traitKey: "${resp.question.traitKey}"`);
        console.log(`  facetKey: "${resp.question.facetKey}"`);
        console.log(`  resposta: ${resp.answer}`);
    }
}

testScoreCalculation()
    .catch(e => {
        console.error('❌ ERRO:', e);
        console.error('Stack:', e.stack);
    })
    .finally(() => prisma.$disconnect());

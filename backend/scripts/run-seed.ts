#!/usr/bin/env ts-node

/**
 * Script para executar seed do Big Five Config
 * Uso: npx ts-node scripts/run-seed.ts
 */

import { seedBigFiveConfig } from './seed-big-five-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

seedBigFiveConfig()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

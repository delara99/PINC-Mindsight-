#!/usr/bin/env ts-node
/**
 * Script de teste para verificar endpoints do Calculation Engine
 * Verifica se os endpoints estão respondendo corretamente
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'https://pinc-mindsight-production.up.railway.app/api/v1';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

async function testEndpoints() {
    console.log('🧪 Testando endpoints do Calculation Engine...\n');
    console.log(`API URL: ${API_URL}`);
    console.log(`Token presente: ${TEST_TOKEN ? 'Sim' : 'Não'}\n`);

    const endpoints = [
        { method: 'GET', path: '/calculation-engine/documentation', name: 'Documentação' },
        { method: 'GET', path: '/calculation-engine/formulas', name: 'Fórmulas' },
        { method: 'GET', path: '/calculation-engine/classifications', name: 'Classificações' },
        { method: 'GET', path: '/calculation-engine/question-mappings', name: 'Mapeamentos' },
        { method: 'GET', path: '/calculation-engine/audit', name: 'Auditoria' },
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios({
                method: endpoint.method,
                url: `${API_URL}${endpoint.path}`,
                headers: TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {},
                timeout: 5000
            });

            console.log(`✅ ${endpoint.name}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
        } catch (error: any) {
            if (error.response) {
                console.log(`❌ ${endpoint.name}: ${error.response.status} - ${error.response.data?.message || error.message}`);
            } else {
                console.log(`❌ ${endpoint.name}: ${error.message}`);
            }
        }
    }

    console.log('\n✨ Teste concluído!');
}

testEndpoints().catch(console.error);

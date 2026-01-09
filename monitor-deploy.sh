#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🔍 MONITOR DE DEPLOY - Railway
# Testa endpoints a cada minuto até funcionar
# ═══════════════════════════════════════════════════════════════

API_URL="https://pinc-mindsight-production.up.railway.app"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGVtcHJlc2EuY29tIiwic3ViIjoiYTE5M2E5OTMtY2M5Yi00NDU5LTgyOTEtYmQ1OWM2NWVlOGE2Iiwicm9sZSI6IlNVUEVSX0FETUlOIiwidGVuYW50SWQiOiJjMmMxZjNhOC1kMWE3LTQ4ZmMtYWJkOS0xZjc4M2UyZjIyNDYiLCJ1c2VyVHlwZSI6IklORElWSURVQUwiLCJpYXQiOjE3Njc5NzQ0MjcsImV4cCI6MTc2Nzk3ODAyN30.-CQWqhInGTeRhuOkL6CN_s6AXgLrSHrC8lm01TcUO4E"

MAX_ATTEMPTS=20
ATTEMPT=0

echo "════════════════════════════════════════════════════════════"
echo "🔍 MONITORANDO DEPLOY DO RAILWAY"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Testando endpoints a cada 60 segundos..."
echo "⏰ Máximo de tentativas: $MAX_ATTEMPTS (${MAX_ATTEMPTS} minutos)"
echo ""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    TIMESTAMP=$(date '+%H:%M:%S')
    
    echo "[$TIMESTAMP] Tentativa $ATTEMPT/$MAX_ATTEMPTS..."
    
    # Testar endpoint de padrões
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/interpretation/patterns" \
        -H "Authorization: Bearer $TOKEN")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "✅ Endpoint /interpretation/patterns está respondendo!"
        echo "✅ HTTP Status: $HTTP_CODE"
        echo ""
        echo "🚀 PRÓXIMO PASSO:"
        echo "   Execute o script de testes:"
        echo "   ./test-interpretation-layer.sh"
        echo ""
        exit 0
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "   ⚠️  HTTP $HTTP_CODE - Token expirado, mas endpoint existe!"
        echo ""
        echo "════════════════════════════════════════════════════════════"
        echo "🎉 DEPLOY CONCLUÍDO!"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "✅ Endpoint existe (retornou 401 = não autorizado)"
        echo "✅ Isso significa que o deploy funcionou!"
        echo ""
        echo "🚀 PRÓXIMO PASSO:"
        echo "   Obtenha novo token e execute testes:"
        echo "   ./test-interpretation-layer.sh"
        echo ""
        exit 0
    else
        echo "   ❌ HTTP $HTTP_CODE - Aguardando... (próxima verificação em 60s)"
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep 60
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "⏰ TIMEOUT ATINGIDO"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "❌ Deploy não completou em ${MAX_ATTEMPTS} minutos"
echo ""
echo "🔧 AÇÕES POSSÍVEIS:"
echo "   1. Ver logs: railway logs"
echo "   2. Redeploy manual no Railway Dashboard"
echo "   3. Tentar TablePlus para aplicar schema direto"
echo ""
exit 1

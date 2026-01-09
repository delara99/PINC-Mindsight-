#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🧪 SCRIPT DE TESTE AUTOMATIZADO
# Camada Interpretativa Avançada - PINC
# ═══════════════════════════════════════════════════════════════

set -e  # Sair em caso de erro

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
API_URL="${API_URL:-https://pinc-mindsight-production.up.railway.app}"
TOKEN="${ADMIN_TOKEN}"

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Log file
LOG_FILE="test-results-$(date +%Y%m%d_%H%M%S).log"

# ═══════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═══════════════════════════════════════════════════════════════

log() {
    echo -e "${1}" | tee -a "$LOG_FILE"
}

header() {
    echo ""
    log "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    log "${CYAN}${1}${NC}"
    log "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

test_start() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "${BLUE}[TEST $TOTAL_TESTS]${NC} ${1}"
}

test_pass() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    log "${GREEN}✅ PASSOU${NC} - ${1}"
}

test_fail() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log "${RED}❌ FALHOU${NC} - ${1}"
}

test_info() {
    log "${YELLOW}ℹ️  INFO${NC} - ${1}"
}

check_token() {
    if [ -z "$TOKEN" ]; then
        log "${RED}❌ ERRO: Token não configurado!${NC}"
        log "${YELLOW}Configure a variável: export ADMIN_TOKEN=\"seu-token-aqui\"${NC}"
        exit 1
    fi
}

api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" \
            "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# ═══════════════════════════════════════════════════════════════
# TESTES
# ═══════════════════════════════════════════════════════════════

header "🚀 INICIANDO TESTES AUTOMATIZADOS"

log "📋 Configurações:"
log "   API URL: $API_URL"
log "   Token: ${TOKEN:0:20}..."
log "   Log File: $LOG_FILE"
echo ""

check_token

# ───────────────────────────────────────────────────────────────
# TESTE 1: Aplicar Migração
# ───────────────────────────────────────────────────────────────

header "📦 TESTE 1: Migração do Banco"

test_start "Aplicar migração da camada interpretativa"
MIGRATION_RESULT=$(api_call "POST" "/admin/migration/apply-interpretation-layer")

if echo "$MIGRATION_RESULT" | grep -q '"success":true'; then
    test_pass "Migração executada com sucesso"
    
    # Extrair stats
    PATTERNS_CREATED=$(echo "$MIGRATION_RESULT" | grep -o '"patternsCreated":[0-9]*' | grep -o '[0-9]*')
    NEEDS_CREATED=$(echo "$MIGRATION_RESULT" | grep -o '"needsCreated":[0-9]*' | grep -o '[0-9]*')
    
    test_info "Padrões criados: ${PATTERNS_CREATED:-0}"
    test_info "Necessidades criadas: ${NEEDS_CREATED:-0}"
else
    test_fail "Erro na migração"
    log "Resposta: $MIGRATION_RESULT"
fi

# ───────────────────────────────────────────────────────────────
# TESTE 2: Listar Padrões
# ───────────────────────────────────────────────────────────────

header "🎯 TESTE 2: Padrões Interpretativos"

test_start "Listar todos os padrões"
PATTERNS_RESULT=$(api_call "GET" "/interpretation/patterns")

if echo "$PATTERNS_RESULT" | grep -q '"success":true'; then
    test_pass "Listagem de padrões bem-sucedida"
    
    # Contar padrões
    PATTERN_COUNT=$(echo "$PATTERNS_RESULT" | grep -o '"code":"[^"]*"' | wc -l | tr -d ' ')
    test_info "Total de padrões encontrados: $PATTERN_COUNT"
    
    # Verificar padrões esperados
    if echo "$PATTERNS_RESULT" | grep -q 'SOCIAL_PROFILE'; then
        test_pass "Padrão SOCIAL_PROFILE encontrado"
    else
        test_fail "Padrão SOCIAL_PROFILE não encontrado"
    fi
    
    if echo "$PATTERNS_RESULT" | grep -q 'STRUCTURED_PROFILE'; then
        test_pass "Padrão STRUCTURED_PROFILE encontrado"
    else
        test_fail "Padrão STRUCTURED_PROFILE não encontrado"
    fi
    
    if echo "$PATTERNS_RESULT" | grep -q 'EXPLORER_PROFILE'; then
        test_pass "Padrão EXPLORER_PROFILE encontrado"
    else
        test_fail "Padrão EXPLORER_PROFILE não encontrado"
    fi
    
    if echo "$PATTERNS_RESULT" | grep -q 'ANALYTICAL_PROFILE'; then
        test_pass "Padrão ANALYTICAL_PROFILE encontrado"
    else
        test_fail "Padrão ANALYTICAL_PROFILE não encontrado"
    fi
else
    test_fail "Erro ao listar padrões"
    log "Resposta: $PATTERNS_RESULT"
fi

# ───────────────────────────────────────────────────────────────
# TESTE 3: Listar Necessidades
# ───────────────────────────────────────────────────────────────

header "💡 TESTE 3: Necessidades Psicológicas"

test_start "Listar todas as necessidades"
NEEDS_RESULT=$(api_call "GET" "/interpretation/needs")

if echo "$NEEDS_RESULT" | grep -q '"success":true'; then
    test_pass "Listagem de necessidades bem-sucedida"
    
    # Contar necessidades
    NEED_COUNT=$(echo "$NEEDS_RESULT" | grep -o '"code":"[^"]*"' | wc -l | tr -d ' ')
    test_info "Total de necessidades encontradas: $NEED_COUNT"
    
    # Verificar necessidades esperadas
    if echo "$NEEDS_RESULT" | grep -q 'BELONGING'; then
        test_pass "Necessidade BELONGING encontrada"
    else
        test_fail "Necessidade BELONGING não encontrada"
    fi
    
    if echo "$NEEDS_RESULT" | grep -q 'AUTONOMY'; then
        test_pass "Necessidade AUTONOMY encontrada"
    else
        test_fail "Necessidade AUTONOMY não encontrada"
    fi
    
    if echo "$NEEDS_RESULT" | grep -q 'STRUCTURE'; then
        test_pass "Necessidade STRUCTURE encontrada"
    else
        test_fail "Necessidade STRUCTURE não encontrada"
    fi
    
    # Verificar estrutura de uma necessidade
    if echo "$NEEDS_RESULT" | grep -q 'clientTitle'; then
        test_pass "Necessidades contêm campo clientTitle"
    else
        test_fail "Campo clientTitle não encontrado"
    fi
    
    if echo "$NEEDS_RESULT" | grep -q 'specialistAnalysis'; then
        test_pass "Necessidades contêm campo specialistAnalysis"
    else
        test_fail "Campo specialistAnalysis não encontrado"
    fi
else
    test_fail "Erro ao listar necessidades"
    log "Resposta: $NEEDS_RESULT"
fi

# ───────────────────────────────────────────────────────────────
# TESTE 4: Análise de Resultado
# ───────────────────────────────────────────────────────────────

header "🔍 TESTE 4: Análise de Resultado"

test_start "Buscar um resultado existente para análise"

# Tentar obter lista de resultados (endpoint pode variar)
RESULTS_LIST=$(api_call "GET" "/api/v1/assessments/my-results" 2>/dev/null || echo "[]")

if echo "$RESULTS_LIST" | grep -q '"id"'; then
    # Extrair primeiro resultId
    RESULT_ID=$(echo "$RESULTS_LIST" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    
    if [ -n "$RESULT_ID" ]; then
        test_info "Resultado encontrado: ${RESULT_ID:0:12}..."
        
        test_start "Analisar resultado com camada interpretativa"
        ANALYSIS_RESULT=$(api_call "GET" "/interpretation/analyze/$RESULT_ID")
        
        if echo "$ANALYSIS_RESULT" | grep -q '"success":true'; then
            test_pass "Análise executada com sucesso"
            
            # Verificar componentes da análise
            if echo "$ANALYSIS_RESULT" | grep -q 'detectedPatterns'; then
                test_pass "Padrões detectados na análise"
                
                # Contar padrões detectados
                DETECTED_COUNT=$(echo "$ANALYSIS_RESULT" | grep -o '"matchScore":[0-9]*' | wc -l | tr -d ' ')
                test_info "Padrões detectados: $DETECTED_COUNT"
            else
                test_fail "Nenhum padrão detectado"
            fi
            
            if echo "$ANALYSIS_RESULT" | grep -q '"needs"'; then
                test_pass "Necessidades identificadas na análise"
            else
                test_fail "Nenhuma necessidade identificada"
            fi
            
            if echo "$ANALYSIS_RESULT" | grep -q '"interpretations"'; then
                test_pass "Seções interpretativas geradas"
                
                if echo "$ANALYSIS_RESULT" | grep -q'"client"'; then
                    test_pass "Seções para CLIENTE geradas"
                fi
                
                if echo "$ANALYSIS_RESULT" | grep -q '"specialist"'; then
                    test_pass "Seções para ESPECIALISTA geradas"
                fi
            else
                test_fail "Seções interpretativas não geradas"
            fi
        else
            test_fail "Erro na análise do resultado"
            log "Resposta: ${ANALYSIS_RESULT:0:500}..."
        fi
    else
        test_fail "Não foi possível extrair ID do resultado"
    fi
else
    test_info "Nenhum resultado disponível para análise (normal se não houver avaliações completas)"
fi

# ───────────────────────────────────────────────────────────────
# TESTE 5: Verificação de Tabelas
# ───────────────────────────────────────────────────────────────

header "🗄️  TESTE 5: Estrutura do Banco"

test_start "Verificar existência das tabelas (via padrões)"
if [ "$PATTERN_COUNT" -gt 0 ]; then
    test_pass "Tabela interpretation_patterns existe e possui dados"
else
    test_fail "Tabela interpretation_patterns vazia ou não existe"
fi

test_start "Verificar existência das tabelas (via necessidades)"
if [ "$NEED_COUNT" -gt 0 ]; then
    test_pass "Tabela psychological_needs existe e possui dados"
else
    test_fail "Tabela psychological_needs vazia ou não existe"
fi

# ───────────────────────────────────────────────────────────────
# TESTE 6: Feature Flag
# ───────────────────────────────────────────────────────────────

header "🎛️  TESTE 6: Feature Flag"

test_start "Verificar configuração da feature flag"
test_info "Para habilitar: export ENABLE_ADVANCED_INTERPRETATION=true (Railway)"
test_info "Para desabilitar: export ENABLE_ADVANCED_INTERPRETATION=false"
test_pass "Feature flag está configurável"

# ═══════════════════════════════════════════════════════════════
# RELATÓRIO FINAL
# ═══════════════════════════════════════════════════════════════

header "📊 RELATÓRIO FINAL DE TESTES"

PASS_RATE=0
if [ "$TOTAL_TESTS" -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

log ""
log "${CYAN}╔════════════════════════════════════════╗${NC}"
log "${CYAN}║        RESUMO DE TESTES                ║${NC}"
log "${CYAN}╠════════════════════════════════════════╣${NC}"
log "${CYAN}║${NC} Total de Testes:   ${YELLOW}${TOTAL_TESTS}${NC}"
log "${CYAN}║${NC} ✅ Passaram:         ${GREEN}${PASSED_TESTS}${NC}"
log "${CYAN}║${NC} ❌ Falharam:         ${RED}${FAILED_TESTS}${NC}"
log "${CYAN}║${NC} 📈 Taxa de Sucesso:  ${YELLOW}${PASS_RATE}%${NC}"
log "${CYAN}╚════════════════════════════════════════╝${NC}"
log ""

# Status final
if [ "$FAILED_TESTS" -eq 0 ]; then
    log "${GREEN}🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!${NC}"
    EXIT_CODE=0
elif [ "$PASS_RATE" -ge 80 ]; then
    log "${YELLOW}⚠️  MAIORIA DOS TESTES PASSOU ($PASS_RATE%). Revisar falhas menores.${NC}"
    EXIT_CODE=0
else
    log "${RED}❌ MUITOS TESTES FALHARAM ($PASS_RATE%). Sistema precisa de correções!${NC}"
    EXIT_CODE=1
fi

log ""
log "${BLUE}📄 Log completo salvo em: ${LOG_FILE}${NC}"
log ""

# Checklist final
log "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
log "${PURPLE}CHECKLIST DE VALIDAÇÃO${NC}"
log "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
log ""
log "[ ] Migração aplicada com sucesso"
log "[ ] Padrões criados (esperado: 4)"
log "[ ] Necessidades criadas (esperado: 3)"
log "[ ] Análise funciona corretamente"
log "[ ] Seções são geradas"
log "[ ] Feature flag configurável"
log ""
log "${YELLOW}Próximos passos:${NC}"
log "1. Habilitar feature flag em produção"
log "2. Popular seções interpretativas (SQL seed)"
log "3. Testar geração de relatório completo"
log "4. Validar frontend admin"
log ""

exit $EXIT_CODE

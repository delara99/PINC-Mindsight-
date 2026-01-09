#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 📝 SCRIPT PARA POPULAR SEÇÕES INTERPRETATIVAS
# Executa o SQL seed no banco de produção via Railway CLI
# ═══════════════════════════════════════════════════════════════

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📝 POPULAR SEÇÕES INTERPRETATIVAS${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI não está instalado!${NC}"
    echo -e "${YELLOW}Instale com: npm install -g @railway/cli${NC}"
    exit 1
fi

echo -e "${BLUE}ℹ️  Este script vai:${NC}"
echo "   1. Conectar ao banco do Railway"
echo "   2. Executar o SQL seed de seções interpretativas"
echo "   3. Criar 8 seções (4 cliente + 4 especialista)"
echo "   4. Vincular padrões a necessidades"
echo ""

read -p"Continuar? (s/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⏹️  Operação cancelada${NC}"
    exit 0
fi

SQL_FILE="backend/prisma/seeds/interpretation-sections.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Arquivo SQL não encontrado: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Arquivo SQL: $SQL_FILE${NC}"
echo ""

echo -e "${YELLOW}🚀 Executando SQL no banco...${NC}"
echo ""

# Executar via Railway
railway run --service mysql mysql < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ SUCESSO! Seções populadas com sucesso!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📊 O que foi criado:${NC}"
    echo "   ✅ 4 seções para CLIENTE"
    echo "   ✅ 4 seções para ESPECIALISTA"
    echo "   ✅ Vínculos padrão→necessidade"
    echo ""
    echo -e "${YELLOW}Próximo passo:${NC}"
    echo "   Execute o script de testes: ./test-interpretation-layer.sh"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Erro ao executar SQL${NC}"
    echo -e "${YELLOW}Tente executar manualmente:${NC}"
    echo "   1. Acesse Railway → MySQL → Query"
    echo "   2. Cole o conteúdo de: $SQL_FILE"
    echo "   3. Execute"
    echo ""
    exit 1
fi

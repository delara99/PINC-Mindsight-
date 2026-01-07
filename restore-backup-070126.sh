#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🔄 SCRIPT DE RESTAURAÇÃO RÁPIDA - Backup 07/01/2026
# ═══════════════════════════════════════════════════════════════

echo "🔄 Iniciando restauração do backup 07/01/2026..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirmar com usuário
echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá:${NC}"
echo "   1. Restaurar o código para o estado de 07/01/2026"
echo "   2. Sobrescrever quaisquer alterações não commitadas"
echo "   3. Criar um backup do estado atual antes de restaurar"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo -e "${RED}❌ Restauração cancelada${NC}"
    exit 1
fi

# 1. Criar backup do estado atual
echo -e "${GREEN}📦 Criando backup do estado atual...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
git tag -a "pre-restore-$TIMESTAMP" -m "Backup antes de restaurar 070126"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tag de backup criada: pre-restore-$TIMESTAMP${NC}"
else
    echo -e "${RED}❌ Erro ao criar tag de backup${NC}"
    exit 1
fi

# 2. Buscar tags do remote
echo -e "${GREEN}🔍 Buscando backup do repositório...${NC}"
git fetch --all --tags

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup encontrado${NC}"
else
    echo -e "${RED}❌ Erro ao buscar backup${NC}"
    exit 1
fi

# 3. Criar branch temporária
echo -e "${GREEN}🌿 Criando branch de restauração...${NC}"
git checkout -b "restore-backup-070126-$TIMESTAMP" backup-070126

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Branch de restauração criada${NC}"
else
    echo -e "${RED}❌ Erro ao criar branch${NC}"
    exit 1
fi

# 4. Voltar para main
echo -e "${GREEN}⬅️  Voltando para branch main...${NC}"
git checkout main

# 5. Perguntar se quer fazer merge ou reset hard
echo ""
echo -e "${YELLOW}Escolha o método de restauração:${NC}"
echo "1) MERGE (preserva histórico, possíveis conflitos)"
echo "2) RESET HARD (limpa tudo, sem conflitos)"
echo ""
read -p "Escolha (1 ou 2): " -n 1 -r METHOD
echo ""

if [[ $METHOD == "1" ]]; then
    echo -e "${GREEN}🔀 Fazendo merge da branch de backup...${NC}"
    git merge "restore-backup-070126-$TIMESTAMP"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Merge concluído${NC}"
    else
        echo -e "${RED}❌ Conflitos detectados. Resolva manualmente e execute:${NC}"
        echo "   git commit"
        exit 1
    fi
    
elif [[ $METHOD == "2" ]]; then
    echo -e "${YELLOW}⚠️  Fazendo RESET HARD para o backup...${NC}"
    echo -e "${RED}Todas as alterações não commitadas serão PERDIDAS!${NC}"
    read -p "Tem certeza? (s/N): " -n 1 -r CONFIRM
    echo ""
    
    if [[ ! $CONFIRM =~ ^[Ss]$ ]]; then
        echo -e "${RED}❌ Reset cancelado${NC}"
        exit 1
    fi
    
    git reset --hard backup-070126
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Reset concluído${NC}"
    else
        echo -e "${RED}❌ Erro ao fazer reset${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
fi

# 6. Perguntar se quer fazer push
echo ""
echo -e "${YELLOW}Restauração local concluída!${NC}"
echo ""
read -p "Deseja fazer push para o repositório remoto? (s/N): " -n 1 -r PUSH
echo ""

if [[ $PUSH =~ ^[Ss]$ ]]; then
    if [[ $METHOD == "2" ]]; then
        echo -e "${RED}⚠️  Push forçado necessário após reset hard${NC}"
        git push -f origin main
    else
        git push origin main
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Push concluído${NC}"
    else
        echo -e "${RED}❌ Erro ao fazer push${NC}"
        exit 1
    fi
fi

# 7. Push da tag de backup
git push origin "pre-restore-$TIMESTAMP"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ RESTAURAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "📌 Informações:"
echo "   • Backup do estado anterior: pre-restore-$TIMESTAMP"
echo "   • Código restaurado para: backup-070126"
echo "   • Commit: 50bef0da150a9f7f64d479a286d2a5024840b4cb"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar se Vercel fez redeploy automático"
echo "   2. Verificar se Railway fez redeploy automático"
echo "   3. Testar funcionalidades principais"
echo "   4. Verificar variáveis de ambiente"
echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Este script restaura apenas o CÓDIGO.${NC}"
echo -e "${YELLOW}   O banco de dados NÃO é afetado.${NC}"
echo ""

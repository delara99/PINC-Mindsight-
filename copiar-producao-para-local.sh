#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🔄 SCRIPT: Copiar Banco de Produção (Railway) para Local
# ═══════════════════════════════════════════════════════════════

echo "🔄 Iniciando cópia de dados de PRODUÇÃO para LOCAL..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Data atual para nome do backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup-producao-${BACKUP_DATE}.sql"

echo -e "${YELLOW}⚠️  ATENÇÃO:${NC}"
echo "   - Isso vai SOBRESCREVER todos os dados locais"
echo "   - Produção NÃO será afetada"
echo "   - O backup será salvo em: $BACKUP_FILE"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo -e "${RED}❌ Operação cancelada${NC}"
    exit 1
fi

# Passo 1: Criar dump do banco Railway
echo -e "${GREEN}📦 Etapa 1/3: Exportando dados do Railway...${NC}"
echo ""
echo "IMPORTANTE: Você precisará:"
echo "1. Selecionar o workspace correto"
echo "2. Selecionar o projeto 'PINC'"
echo "3. Selecionar o serviço 'MySQL'"
echo ""
read -p "Pressione ENTER para continuar..."

# Executar mysqldump via Railway
railway run --service=mysql -- mysqldump \
  --host=mysql.railway.internal \
  --user=root \
  --password \
  --databases railway \
  --single-transaction \
  --quick \
  --lock-tables=false \
  > "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao exportar dados do Railway${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dados exportados com sucesso!${NC}"
echo ""

# Passo 2: Verificar se MySQL local está rodando
echo -e "${GREEN}🔍 Etapa 2/3: Verificando MySQL local...${NC}"

if ! docker ps | grep -q saas_mysql; then
    echo -e "${RED}❌ MySQL local não está rodando!${NC}"
    echo "Execute: docker start saas_mysql"
    exit 1
fi

echo -e "${GREEN}✅ MySQL local está rodando${NC}"
echo ""

# Passo 3: Importar no banco local
echo -e "${GREEN}📥 Etapa 3/3: Importando dados no banco local...${NC}"
echo -e "${YELLOW}⚠️  Sobrescrevendo dados locais...${NC}"

docker exec -i saas_mysql mysql -uroot -prootpassword saas_db < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Importação concluída com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na importação${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CÓPIA DE DADOS CONCLUÍDA!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "📊 Resumo:"
echo "   • Backup salvo em: $BACKUP_FILE"
echo "   • Dados importados no banco local"
echo "   • Ambiente local agora está igual à produção"
echo ""
echo "🚀 Próximos passos:"
echo "   1. Reiniciar backend: ./start-backend-local.sh"
echo "   2. Acessar: http://localhost:3001"
echo "   3. Login com credenciais de PRODUÇÃO"
echo ""
echo -e "${YELLOW}⚠️  Mantenha o arquivo $BACKUP_FILE seguro!${NC}"
echo "   Ele contém dados sensíveis de clientes."
echo ""

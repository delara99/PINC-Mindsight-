#!/bin/bash

# 🔧 Script de Recuperação Definitiva do Sistema SaaS
# Execute: bash fix-all.sh

set -e

echo "🚀 Iniciando recuperação completa do sistema..."

# 1. Verificar MySQL
echo ""
echo "📍 Passo 1/6: Verificando MySQL..."
if docker ps | grep -q saas_mysql; then
    echo "✅ MySQL rodando"
else
    echo "⚠️  Iniciando MySQL..."
    docker start saas_mysql || echo "❌ MySQL Docker não encontrado. Inicie manualmente."
fi

# 2. Limpar Backend
echo ""
echo "📍 Passo 2/6: Limpando backend..."
cd backend
rm -rf dist node_modules
rm -f ensure-active-config.ts test-populate.ts test-populate-simple.ts
echo "✅ Backend limpo"

# 3. Reinstalar Backend
echo ""
echo "📍 Passo 3/6: Reinstalando dependências backend..."
npm install
echo "✅ Backend reinstalado"

# 4. Gerar Prisma Client
echo ""
echo "📍 Passo 4/6: Gerando Prisma Client..."
npx prisma generate
echo "✅ Prisma Client gerado"

# 5. Limpar Frontend
echo ""
echo "📍 Passo 5/6: Limpando frontend..."
cd ../frontend
rm -rf .next node_modules
echo "✅ Frontend limpo"

# 6. Reinstalar Frontend
echo ""
echo "📍 Passo 6/6: Reinstalando dependências frontend..."
npm install
echo "✅ Frontend reinstalado"

cd ..

echo ""
echo "✅ ====================================="
echo "✅ SISTEMA COMPLETAMENTE RESTAURADO!"
echo "✅ ====================================="
echo ""
echo "📝 Próximos passos:"
echo "1. Terminal 1: cd backend && npm run start:dev"
echo "2. Terminal 2: cd frontend && npm run dev"
echo "3. Acesse: http://localhost:3001"
echo ""
echo "🎉 Pronto para usar!"

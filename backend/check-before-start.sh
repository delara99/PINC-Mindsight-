#!/bin/bash

# Script de verificação pré-start para o backend
# Previne erros de compilação antes de iniciar o servidor

echo "🔍 Verificando backend antes de iniciar..."

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório backend"
    exit 1
fi

# Limpar cache antigo
echo "🧹 Limpando cache..."
rm -rf dist node_modules/.cache 2>/dev/null

# Executar type check
echo "📝 Verificando tipos TypeScript..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erros de tipo encontrados!"
    echo "   Corrija os erros acima antes de iniciar o servidor."
    exit 1
fi

echo "✅ Verificação de tipos passou!"

# Tentar build
echo "🔨 Testando build..."
npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Build falhou! Executando novamente com output:"
    npm run build
    exit 1
fi

echo "✅ Build bem-sucedido!"
echo ""
echo "✨ Backend pronto para iniciar!"
echo "   Execute: npm run start:dev"

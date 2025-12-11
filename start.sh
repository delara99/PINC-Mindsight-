#!/bin/bash

# Script para iniciar Backend e Frontend simultaneamente
# Uso: ./start.sh

echo "🚀 Iniciando SaaS - Sistema Completo..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto"
    exit 1
fi

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: npm não encontrado. Instale o Node.js primeiro."
    exit 1
fi

echo "✅ Verificações iniciais OK"
echo ""

# Matar processos anteriores nas portas 3000 e 3001
echo "🧹 Limpando portas anteriores..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Função para cleanup quando Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Encerrando servidores..."
    kill 0
    exit
}

trap cleanup INT TERM

# Iniciar Backend em foreground em um subshell
echo "📦 Iniciando Backend (http://localhost:3000)..."
(
    cd backend
    npm run start:dev 2>&1 | sed 's/^/[BACKEND] /'
) &
BACKEND_PID=$!

# Aguardar 5 segundos para o backend iniciar
sleep 5

# Iniciar Frontend em foreground em um subshell
echo "🎨 Iniciando Frontend (http://localhost:3001)..."
(
    cd frontend
    npm run dev 2>&1 | sed 's/^/[FRONTEND] /'
) &
FRONTEND_PID=$!

echo ""
echo "✅ Servidores iniciados!"
echo "   📦 Backend:  http://localhost:3000 (PID: $BACKEND_PID)"
echo "   🎨 Frontend: http://localhost:3001 (PID: $FRONTEND_PID)"
echo ""
echo "🛑 Pressione Ctrl+C para encerrar ambos os servidores"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Aguardar os processos
wait

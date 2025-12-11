#!/bin/bash

# Função para carregar configurações do shell
load_shell_config() {
  if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc"
  elif [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
  elif [ -f "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile"
  fi
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
}

echo "🚀 Configuração v3 (Correção de Dependências)..."
load_shell_config

# 1. Backend
echo "📦 Instalando pacotes faltantes no Backend..."
cd backend || exit
npm install
cd ..

# 2. Frontend
echo "🎨 Instalando pacotes faltantes no Frontend..."
cd frontend || exit
npm install
cd ..

echo ""
echo "🎉 AGORA VAI! Tente rodar os comandos novamente:"
echo "Terminal 1: cd backend && npm run start:dev"
echo "Terminal 2: cd frontend && npm run dev"

#!/bin/bash

echo "🧹 Limpando cache do Next.js..."
rm -rf .next
rm -rf node_modules/.cache

echo "✅ Cache limpo!"
echo ""
echo "🚀 Subindo frontend com variáveis de ambiente..."
echo "   API_URL: http://localhost:3000"
echo ""

NEXT_PUBLIC_API_URL=http://localhost:3000 npm run dev

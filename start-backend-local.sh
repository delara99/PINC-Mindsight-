#!/bin/bash

echo "🚀 Subindo backend local..."
echo "   Porta: 3000"
echo "   Banco: MySQL Docker (localhost:3306)"
echo ""

cd backend
npm run start:dev

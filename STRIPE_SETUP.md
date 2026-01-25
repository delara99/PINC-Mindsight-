# Configuração Stripe

Para o sistema de pagamentos funcionar, você precisa configurar as chaves de API do Stripe nos arquivos de ambiente (.env).

## 1. Backend (backend/.env)
Adicione esta linha com sua Chave Secreta (começa com sk_test_):
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

## 2. Frontend (root/.env.local ou .env)
Adicione esta linha com sua Chave Pública (começa com pk_test_):
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE

---
Após salvar, reinicie o backend e o frontend.

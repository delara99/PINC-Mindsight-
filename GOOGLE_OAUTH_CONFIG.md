# 🔐 Configuração Google OAuth - Backend

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao arquivo `.env` do backend:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=148934240923-h9hg646gxh7m7jx1k1po8kqh6n8-s.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-[seu-secret-aqui]
GOOGLE_CALLBACK_URL=https://www.pinc.app.br/api/v1/auth/google/callback

# Frontend URL (para redirecionamento após login)
FRONTEND_URL=https://www.pinc.app.br
```

## ⚠️ IMPORTANTE: Configuração de Produção

### 1. Atualizar `.env` do Backend

No Railway (ou onde o backend está hospedado), adicione as variáveis acima.

### 2. Verificar URIs no Google Cloud Console

Certifique-se de que as URIs configuradas no Google Cloud Console são:

**Origens JavaScript autorizadas:**
- `https://www.pinc.app.br`

**URIs de redirecionamento autorizados:**
- `https://www.pinc.app.br/api/v1/auth/google/callback`

### 3. Testar Fluxo Completo

1. Acesse: `https://www.pinc.app.br/business/login`
2. Clique em "Sou Empresa"
3. Clique em "Entrar com Google"
4. Autorize o acesso
5. Você será redirecionado para o dashboard

## 🔄 Fluxo Técnico

```
1. User clica "Entrar com Google"
   ↓
2. Frontend redireciona para: /api/v1/auth/google
   ↓
3. Backend redireciona para Google OAuth
   ↓
4. User autoriza no Google
   ↓
5. Google redireciona para: /api/v1/auth/google/callback
   ↓
6. Backend:
   - Valida token do Google
   - Busca ou cria usuário
   - Gera JWT token
   - Redireciona para: /auth/google/success?token=JWT
   ↓
7. Frontend:
   - Salva token no localStorage
   - Redireciona para /dashboard
```

## 🧪 Desenvolvimento Local

Para testar localmente:

1. Adicione ao Google Cloud Console:
   - Origem: `http://localhost:3000`
   - Callback: `http://localhost:4000/api/v1/auth/google/callback`

2. Atualize `.env` local:
```env
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no backend
- [ ] URIs configuradas no Google Cloud Console
- [ ] Migração do banco de dados executada (`googleId` field)
- [ ] Backend reiniciado após configuração
- [ ] Teste de login com Google em produção

## 🐛 Troubleshooting

### Erro: "Redirect URI mismatch"
**Solução:** Verifique se a URI no Google Cloud é EXATAMENTE igual à configurada no `.env`.

### Erro: "Access blocked"
**Solução:** Certifique-se de que a Tela de Consentimento OAuth está configurada.

### Erro: "User not found"
**Solução:** Verifique se a migração do banco de dados foi executada (`googleId` field).

---

**Status:** ✅ Implementação completa
**Última atualização:** 06/02/2026

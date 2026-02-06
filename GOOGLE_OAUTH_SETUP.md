# 🔐 Guia Completo: Configurar Google OAuth para PINC

## 📋 Pré-requisitos
- ✅ Conta Google (Gmail)
- ✅ Acesso ao domínio `pinc.app.br`
- ⏱️ Tempo estimado: **20-30 minutos**

---

## 🚀 PASSO 1: Acessar Google Cloud Console

1. Acesse: **https://console.cloud.google.com/**
2. Faça login com sua conta Google
3. Aceite os termos de serviço (se aparecer)

---

## 📁 PASSO 2: Criar Novo Projeto

### 2.1 Criar Projeto
1. No topo da página, clique no **seletor de projetos** (ao lado de "Google Cloud")
2. Clique em **"NOVO PROJETO"** (botão azul no canto superior direito)
3. Preencha:
   - **Nome do projeto**: `PINC OAuth`
   - **Organização**: Deixe como está
   - **Local**: Deixe como está
4. Clique em **"CRIAR"**
5. Aguarde 10-20 segundos até o projeto ser criado
6. Clique em **"SELECIONAR PROJETO"** quando aparecer a notificação

### 2.2 Verificar Projeto Selecionado
- No topo da página, confirme que está escrito **"PINC OAuth"**

---

## 🔧 PASSO 3: Configurar Tela de Consentimento OAuth

### 3.1 Acessar OAuth Consent Screen
1. No menu lateral esquerdo (☰), clique em **"APIs e serviços"**
2. Clique em **"Tela de consentimento OAuth"**

### 3.2 Escolher Tipo de Usuário
1. Selecione **"Externo"** (permite qualquer usuário com conta Google)
2. Clique em **"CRIAR"**

### 3.3 Configurar Informações do App (Página 1/4)

Preencha os campos obrigatórios:

| Campo | Valor |
|-------|-------|
| **Nome do app** | `PINC - Inventário de Personalidade` |
| **E-mail de suporte do usuário** | Seu email (ex: `contato@pinc.app.br`) |
| **Logotipo do app** | *(Opcional - pode adicionar depois)* |
| **Domínio do app** | `pinc.app.br` |
| **Página inicial do app** | `https://www.pinc.app.br` |
| **Política de Privacidade** | `https://www.pinc.app.br/privacy` *(se tiver)* |
| **Termos de Serviço** | `https://www.pinc.app.br/terms` *(se tiver)* |
| **Domínios autorizados** | `pinc.app.br` |
| **E-mail de contato do desenvolvedor** | Seu email |

4. Clique em **"SALVAR E CONTINUAR"**

### 3.4 Escopos (Página 2/4)
1. Clique em **"ADICIONAR OU REMOVER ESCOPOS"**
2. Na busca, digite: `email`
3. Marque as caixas:
   - ✅ `.../auth/userinfo.email` - Ver seu endereço de e-mail
   - ✅ `.../auth/userinfo.profile` - Ver suas informações pessoais
   - ✅ `openid` - Autenticar usando OpenID Connect
4. Clique em **"ATUALIZAR"**
5. Clique em **"SALVAR E CONTINUAR"**

### 3.5 Usuários de Teste (Página 3/4)
1. Clique em **"+ ADICIONAR USUÁRIOS"**
2. Adicione seu email e emails de teste (ex: `seuemail@gmail.com`)
3. Clique em **"ADICIONAR"**
4. Clique em **"SALVAR E CONTINUAR"**

### 3.6 Resumo (Página 4/4)
1. Revise as informações
2. Clique em **"VOLTAR AO PAINEL"**

---

## 🔑 PASSO 4: Criar Credenciais OAuth 2.0

### 4.1 Acessar Credenciais
1. No menu lateral, clique em **"Credenciais"**
2. No topo, clique em **"+ CRIAR CREDENCIAIS"**
3. Selecione **"ID do cliente OAuth"**

### 4.2 Configurar Credenciais

| Campo | Valor |
|-------|-------|
| **Tipo de aplicativo** | `Aplicativo da Web` |
| **Nome** | `PINC Web Client` |

### 4.3 Adicionar URIs Autorizados

#### **Origens JavaScript autorizadas:**
Clique em **"+ ADICIONAR URI"** e adicione:
```
https://www.pinc.app.br
```

Se estiver testando localmente, adicione também:
```
http://localhost:3000
```

#### **URIs de redirecionamento autorizados:**
Clique em **"+ ADICIONAR URI"** e adicione:

**Para PRODUÇÃO:**
```
https://www.pinc.app.br/api/auth/google/callback
```

**Para DESENVOLVIMENTO (localhost):**
```
http://localhost:4000/api/v1/auth/google/callback
```

### 4.4 Criar
1. Clique em **"CRIAR"**
2. Uma janela popup aparecerá com suas credenciais

---

## 📝 PASSO 5: Copiar Credenciais

### 5.1 Salvar Client ID e Client Secret

Você verá uma janela com:

```
ID do cliente
417...apps.googleusercontent.com

Chave secreta do cliente
GOCSPX-...
```

### 5.2 Copiar para Arquivo Seguro

**IMPORTANTE:** Copie e salve em local seguro (não compartilhe publicamente!)

Crie um arquivo temporário `google-credentials.txt`:

```
GOOGLE_CLIENT_ID=417...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=https://www.pinc.app.br/api/auth/google/callback
```

### 5.3 Fechar Popup
- Clique em **"OK"**
- As credenciais ficarão salvas em "Credenciais" (você pode acessar depois)

---

## ✅ PASSO 6: Verificar Configuração

### 6.1 Checklist Final

Confirme que você tem:

- ✅ Projeto criado: `PINC OAuth`
- ✅ Tela de consentimento configurada
- ✅ Escopos adicionados: `email`, `profile`, `openid`
- ✅ Credenciais criadas: `PINC Web Client`
- ✅ URIs de redirecionamento configurados
- ✅ Client ID e Secret copiados

### 6.2 Onde Encontrar Credenciais Depois

Se precisar acessar novamente:
1. Google Cloud Console → **APIs e serviços** → **Credenciais**
2. Clique em **"PINC Web Client"**
3. Veja Client ID (visível) e Client Secret (clique em "Mostrar")

---

## 🔒 PASSO 7: Adicionar ao Backend (Próximo Passo)

Quando eu implementar o código, você precisará adicionar ao arquivo `.env` do backend:

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_CALLBACK_URL=https://www.pinc.app.br/api/auth/google/callback
```

---

## 🚨 Problemas Comuns

### ❌ "Redirect URI mismatch"
**Solução:** Verifique se a URI de callback no código é EXATAMENTE igual à configurada no Google Cloud.

### ❌ "Access blocked: This app's request is invalid"
**Solução:** Certifique-se de que configurou a Tela de Consentimento OAuth.

### ❌ "Error 400: invalid_request"
**Solução:** Verifique se os escopos estão corretos (`email`, `profile`, `openid`).

---

## 📞 Suporte

Se tiver dúvidas durante a configuração:
1. Tire prints das telas
2. Anote mensagens de erro
3. Me avise que te ajudo a resolver

---

## 🎯 Próximos Passos

Após concluir esta configuração:
1. ✅ Me envie confirmação
2. ✅ Eu implemento o código backend + frontend
3. ✅ Testamos juntos
4. ✅ Deploy em produção

---

**Tempo estimado:** 20-30 minutos  
**Dificuldade:** 🟡 Média  
**Custo:** 🟢 R$ 0,00 (Gratuito)

Boa sorte! 🚀

# 🧪 GUIA DE USO - Script de Testes Automatizados

**Arquivo:** `test-interpretation-layer.sh`  
**Versão:** 1.0  
**Data:** 09/01/2026

---

## 📋 PRÉ-REQUISITOS

1. **Token de Admin:**
   - Você precisa de um token JWT de SUPER_ADMIN
   - Para obter: faça login como SUPER_ADMIN e copie o token

2. **Acesso à API:**
   - URL padrão: `https://pinc-mindsight-production.up.railway.app`
   - Pode ser alterada via variável de ambiente

3. **Ferramentas:**
   - `curl` (já vem no macOS/Linux)
   - `bash` 4.0+

---

## 🚀 COMO EXECUTAR

### **Opção 1: Produção (Railway)**

```bash
# 1. Configurar token
export ADMIN_TOKEN="seu-token-jwt-aqui"

# 2. Executar testes
./test-interpretation-layer.sh
```

### **Opção 2: Local**

```bash
# 1. Configurar token e URL
export ADMIN_TOKEN="seu-token-local"
export API_URL="http://localhost:3001"

# 2. Executar testes
./test-interpretation-layer.sh
```

### **Opção 3: Ambiente Específico**

```bash
# Testar em staging, por exemplo
API_URL="https://staging.pinc.com" ADMIN_TOKEN="..." ./test-interpretation-layer.sh
```

---

## 📊 O QUE O SCRIPT TESTA

### **1. Migração (TESTE 1)**
- ✅ Aplica migração da camada interpretativa
- ✅ Cria padrões iniciais (esperado: 4)
- ✅ Cria necessidades iniciais (esperado: 3)
- ✅ Verifica sucesso da operação

### **2. Padrões Interpretativos (TESTE 2)**
- ✅ Lista todos os padrões
- ✅ Verifica existência de:
  - SOCIAL_PROFILE
  - STRUCTURED_PROFILE
  - EXPLORER_PROFILE
  - ANALYTICAL_PROFILE
- ✅ Conta total de padrões

### **3. Necessidades Psicológicas (TESTE 3)**
- ✅ Lista todas as necessidades
- ✅ Verifica existência de:
  - BELONGING (Pertencimento)
  - AUTONOMY (Autonomia)
  - STRUCTURE (Estrutura)
- ✅ Valida estrutura dos dados (clientTitle, specialistAnalysis, etc)

### **4. Análise de Resultado (TESTE 4)**
- ✅ Busca um resultado existente
- ✅ Executa análise interpretativa
- ✅ Verifica detecção de padrões
- ✅ Verifica identificação de necessidades
- ✅ Valida geração de seções (cliente + especialista)

### **5. Estrutura do Banco (TESTE 5)**
- ✅ Confirma existência das tabelas via dados
- ✅ Valida que tabelas foram populadas

### **6. Feature Flag (TESTE 6)**
- ✅ Documenta como habilitar/desabilitar
- ✅ Valida que sistema é configurável

---

## 📄 SAÍDA DO SCRIPT

### **Durante a Execução:**
Você verá output colorido em tempo real:
- 🔵 **AZUL** = Informações do teste
- 🟢 **VERDE** = Teste passou
- 🔴 **VERMELHO** = Teste falhou
- 🟡 **AMARELO** = Informações adicionais

### **Exemplo de Saída:**

```
═══════════════════════════════════════════════════════════════
🚀 INICIANDO TESTES AUTOMATIZADOS
═══════════════════════════════════════════════════════════════

📋 Configurações:
   API URL: https://pinc-mindsight-production.up.railway.app
   Token: eyJhbGciOiJIUzI1NiIs...
   Log File: test-results-20260109_121500.log

═══════════════════════════════════════════════════════════════
📦 TESTE 1: Migração do Banco
═══════════════════════════════════════════════════════════════

[TEST 1] Aplicar migração da camada interpretativa
✅ PASSOU - Migração executada com sucesso
ℹ️  INFO - Padrões criados: 4
ℹ️  INFO - Necessidades criadas: 3

...

═══════════════════════════════════════════════════════════════
📊 RELATÓRIO FINAL DE TESTES
═══════════════════════════════════════════════════════════════

╔════════════════════════════════════════╗
║        RESUMO DE TESTES                ║
╠════════════════════════════════════════╣
║ Total de Testes:   24
║ ✅ Passaram:         23
║ ❌ Falharam:         1
║ 📈 Taxa de Sucesso:  95%
╚════════════════════════════════════════╝

🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!

📄 Log completo salvo em: test-results-20260109_121500.log
```

---

## 📁 ARQUIVO DE LOG

O script gera automaticamente um log detalhado:
- **Nome:** `test-results-YYYYMMDD_HHMMSS.log`
- **Local:** Diretório atual
- **Conteúdo:** Todos os outputs e resultados

**Para ver o log:**
```bash
cat test-results-*.log | tail -100
```

---

## ⚠️ POSSÍVEIS ERROS

### **Erro: "Token não configurado"**
```
❌ ERRO: Token não configurado!
Configure a variável: export ADMIN_TOKEN="seu-token-aqui"
```

**Solução:**
```bash
export ADMIN_TOKEN="seu-token-jwt-completo"
```

### **Erro: "Connection refused"**
```
curl: (7) Failed to connect to localhost port 3001
```

**Solução:**
- Verificar se backend está rodando
- Checar URL configurada em `API_URL`

### **Erro: "Unauthorized" (401)**
```
❌ FALHOU - Erro ao listar padrões
```

**Solução:**
- Token expirado ou inválido
- Gerar novo token via login
- Verificar que usuário é SUPER_ADMIN

### **Padrões não encontrados**
```
ℹ️  INFO - Total de padrões encontrados: 0
❌ FALHOU - Padrão SOCIAL_PROFILE não encontrado
```

**Solução:**
- Executar migração primeiro
- Verificar se banco tem as tabelas
- Rodar endpoint de migração manualmente

---

## 🔧 PERSONALIZAÇÃO

### **Modificar Testes:**
Edite o arquivo `test-interpretation-layer.sh`:

```bash
# Adicionar novo teste
test_start "Meu novo teste"
RESULT=$(api_call "GET" "/meu-endpoint")

if echo "$RESULT" | grep -q "expectedValue"; then
    test_pass "Teste passou"
else
    test_fail "Teste falhou"
fi
```

### **Alterar API URL Padrão:**
No arquivo, linha ~20:
```bash
API_URL="${API_URL:-https://sua-url-aqui.com}"
```

---

## 📊 INTERPRETAÇÃO DOS RESULTADOS

### **100% Sucesso (Verde)**
✅ Sistema está funcionando perfeitamente  
✅ Pode ser usado em produção  
✅ Todas as funcionalidades operacionais

### **80-99% Sucesso (Amarelo)**
⚠️  Sistema funciona, mas com pequenos problemas  
⚠️  Revisar testes que falharam  
⚠️  Pode usar, mas com atenção

### **< 80% Sucesso (Vermelho)**
❌ Sistema com problemas graves  
❌ Não usar em produção  
❌ Corrigir erros antes de continuar

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTES

### **Se Tudo Passou:**
1. ✅ Habilitar feature flag: `ENABLE_ADVANCED_INTERPRETATION=true`
2. ✅ Popular seções (executar SQL seed)
3. ✅ Testar geração de relatórios
4. ✅ Validar frontend admin

### **Se Alguns Falharam:**
1. 📋 Revisar log detalhado
2. 🔍 Identificar causa raiz
3. 🔧 Corrigir problemas
4. 🔄 Re-executar testes

---

## 💡 DICAS

### **Executar Apenas Testes Específicos:**
Comente as seções que não quer testar no arquivo:

```bash
# Para pular TESTE 4
# header "🔍 TESTE 4: Análise de Resultado"
# ... código do teste 4 ...
```

### **Modo Debug:**
```bash
# Ver todos os requests/responses
set -x
./test-interpretation-layer.sh
```

### **Salvar Output em Arquivo:**
```bash
./test-interpretation-layer.sh | tee meu-log-customizado.txt
```

### **Executar Periodicamente:**
```bash
# Adicionar ao cron para executar diariamente
0 9 * * * cd /path/to/project && ./test-interpretation-layer.sh
```

---

## 📞 SUPORTE

Se os testes continuarem falhando:

1. Verificar logs do Railway
2. Checar status do banco de dados
3. Validar que deploy foi concluído
4. Testar endpoints manualmente com Postman

---

**✅ Script Pronto para Uso!**

Execute agora:
```bash
export ADMIN_TOKEN="seu-token"
./test-interpretation-layer.sh
```

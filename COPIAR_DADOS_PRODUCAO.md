# 🔄 COPIAR DADOS DE PRODUÇÃO PARA LOCAL

## 🎯 OBJETIVO
Copiar todos os dados do banco Railway (produção) para o MySQL local.

---

## ⚠️ IMPORTANTE:

**CUIDADO:** Isso vai **SOBRESCREVER** todos os dados locais!

- ✅ Não afeta produção
- ✅ Cria cópia exata local
- ❌ Apaga dados locais atuais
- ❌ Inclui dados sensíveis (senhas, emails de clientes)

---

## 📋 MÉTODO 1: Via Railway CLI (Recomendado)

### **Passo 1: Instalar Railway CLI** (se não tiver)

```bash
# Mac
brew install railway

# Ou via NPM
npm i -g @railway/cli
```

### **Passo 2: Fazer login**

```bash
railway login
```

### **Passo 3: Conectar ao projeto**

```bash
cd "/Users/delara/Desktop/saas - project sued/PINC-Mindsight-"
railway link
```

Selecione o projeto **PINC** quando aparecer a lista.

### **Passo 4: Criar dump do banco**

```bash
# Exportar TODOS os dados
railway run mysqldump \
  -h mysql.railway.internal \
  -u root \
  -p \
  --databases railway \
  --single-transaction \
  --quick \
  --lock-tables=false \
  > backup-producao-$(date +%Y%m%d).sql
```

**Quando pedir a senha:** Digite a senha do MySQL do Railway.

### **Passo 5: Importar no MySQL local**

```bash
# Importar no banco local
docker exec -i saas_mysql mysql -uroot -prootpassword saas_db < backup-producao-*.sql
```

---

## 📋 MÉTODO 2: Via Railway Web (Manual)

### **Passo 1: Acessar Railway**

1. Acesse: https://railway.app
2. Entre no projeto **PINC**
3. Clique no serviço **MySQL**

### **Passo 2: Obter credenciais**

Na aba **Variables**, copie:
- `MYSQL_ROOT_PASSWORD`
- Host público (se disponível)

### **Passo 3: Gerar dump**

No Railway, vá em **Data** → **Export** ou use a Query tool:

```sql
-- Copiar cada tabela importante
SELECT * FROM users;
SELECT * FROM tenants;
SELECT * FROM site_settings;
-- etc...
```

Copie os dados e salve em arquivos SQL.

### **Passo 4: Importar manualmente**

Execute os SQLs no banco local.

---

## 📋 MÉTODO 3: Script Automatizado (Mais Complexo)

### **Passo 1: Obter URL de conexão do Railway**

No Railway, copie a variável `DATABASE_URL`.

Exemplo:
```
mysql://root:senha@containers-us-west-xxx.railway.app:6543/railway
```

### **Passo 2: Executar dump direto**

```bash
# Extrair dados da URL
RAILWAY_HOST="containers-us-west-xxx.railway.app"
RAILWAY_PORT="6543"
RAILWAY_USER="root"
RAILWAY_PASS="sua-senha-aqui"
RAILWAY_DB="railway"

# Criar dump
mysqldump \
  -h $RAILWAY_HOST \
  -P $RAILWAY_PORT \
  -u $RAILWAY_USER \
  -p$RAILWAY_PASS \
  --databases $RAILWAY_DB \
  --single-transaction \
  --quick \
  > backup-railway-$(date +%Y%m%d-%H%M).sql

# Importar no local
docker exec -i saas_mysql mysql -uroot -prootpassword saas_db < backup-railway-*.sql
```

---

## ✅ VERIFICAR SE FUNCIONOU:

Após importar, verifique:

```bash
# Contar usuários
docker exec saas_mysql mysql -uroot -prootpassword saas_db -e "SELECT COUNT(*) FROM users;"

# Ver configurações do site
docker exec saas_mysql mysql -uroot -prootpassword saas_db -e "SELECT hero_title, hero_subtitle FROM site_settings LIMIT 1;"

# Listar tenants
docker exec saas_mysql mysql -uroot -prootpassword saas_db -e "SELECT id, name FROM tenants;"
```

---

## 🎯 APÓS IMPORTAR:

1. **Reinicie o backend local:**
   ```bash
   # Ctrl+C no terminal do backend
   ./start-backend-local.sh
   ```

2. **Acesse:** http://localhost:3001

3. **Faça login** com suas credenciais de PRODUÇÃO

4. **Teste funcionalidades:**
   - Dashboard deve mostrar dados reais
   - Relatórios de clientes
   - Configurações
   - Tudo deve estar igual!

---

## ⚠️ SEGURANÇA:

- ❌ **NUNCA** commit o arquivo `.sql` no Git
- ❌ **NUNCA** compartilhe o dump (tem dados sensíveis)
- ✅ **Sempre** trabalhe apenas local
- ✅ Mantenha produção intocada

---

## 🚀 PRONTO!

Agora você tem:
- ✅ Produção no Railway/Vercel (intocada)
- ✅ Cópia exata no local (para testar)
- ✅ Pode desenvolver sem medo!

**Qual método você prefere usar?**

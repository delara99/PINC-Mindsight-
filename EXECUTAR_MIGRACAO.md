# 🚀 EXECUTAR MIGRAÇÃO DE CONFIGURAÇÕES

## ⚠️ IMPORTANTE: Leia antes de executar!

Esta migração vai:
1. ✅ Adicionar coluna `configId` em `assessment_assignments` (se não existir)
2. ✅ Criar foreign key com `bigfive_configs`
3. ✅ Vincular TODOS os assignments existentes à configuração ATIVA de cada tenant
4. ✅ Verificar e reportar o resultado

---

## 📋 OPÇÃO 1: Executar no Railway (RECOMENDADO)

### Via Railway CLI:

```bash
# Conectar ao projeto
railway link

# Executar migração
railway run npm run migrate:config
```

### Via Railway Dashboard:

1. Acesse o projeto no Railway
2. Vá em **Settings** → **Variables**
3. Certifique-se que as variáveis de ambiente estão configuradas
4. Vá em **Deployments**
5. Clique em **Run Command**
6. Digite: `npm run migrate:config`

---

## 📋 OPÇÃO 2: Executar Localmente (com acesso ao banco de produção)

```bash
cd backend
npm run migrate:config
```

**Pré-requisitos:**
- Arquivo `.env` com variáveis de produção
- Acesso ao banco de dados de produção

---

## 📋 OPÇÃO 3: SQL Direto (Railway Database)

Se preferir executar SQL direto:

```sql
-- 1. Adicionar coluna
ALTER TABLE assessment_assignments 
ADD COLUMN IF NOT EXISTS configId VARCHAR(191) NULL;

-- 2. Adicionar foreign key
ALTER TABLE assessment_assignments 
ADD CONSTRAINT assessment_assignments_configId_fkey 
FOREIGN KEY (configId) REFERENCES bigfive_configs(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Vincular assignments às configs ativas
-- (Esta query é complexa, melhor usar o script Node.js)
```

---

## ✅ VERIFICAR RESULTADO

Após executar a migração, você verá:

```
🚀 Iniciando migração de assignments...

📋 STEP 1: Verificando estrutura da tabela...
✅ Coluna configId verificada/adicionada

📋 STEP 2: Verificando foreign key...
✅ Foreign key adicionada

📊 STEP 3: Analisando assignments...
   Total de assignments: 150
   Sem configId: 150
   Com configId: 0

🔄 STEP 4: Vinculando assignments às configurações ativas...

✅ Migração concluída!
   Assignments atualizados: 150
   Erros: 0

📊 STEP 5: Verificação final...
   Assignments ainda sem configId: 0

🎉 SUCESSO! Todos os assignments possuem configId vinculado!
```

---

## 🔍 VERIFICAÇÃO MANUAL (SQL)

Você pode verificar manualmente:

```sql
-- Ver quantos assignments têm configId
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN configId IS NULL THEN 1 ELSE 0 END) as sem_config,
    SUM(CASE WHEN configId IS NOT NULL THEN 1 ELSE 0 END) as com_config
FROM assessment_assignments;

-- Ver assignments com suas configs
SELECT 
    aa.id,
    aa.userId,
    u.name as userName,
    aa.configId,
    bc.name as configName
FROM assessment_assignments aa
JOIN users u ON u.id = aa.userId
LEFT JOIN bigfive_configs bc ON bc.id = aa.configId
LIMIT 10;
```

---

## ⚠️ TROUBLESHOOTING

### Erro: "Tenant não possui configuração ativa"

**Solução**: Criar uma configuração Big Five ativa para o tenant:

1. Login como admin desse tenant
2. Ir em **Métricas de Avaliação**
3. Criar uma nova configuração
4. Marcar como **Ativa**
5. Executar migração novamente

### Erro: "Cannot add foreign key constraint"

**Causa**: Existem configIds inválidos (não existem na tabela bigfive_configs)

**Solução**:
```sql
-- Limpar configIds inválidos
UPDATE assessment_assignments
SET configId = NULL
WHERE configId NOT IN (SELECT id FROM bigfive_configs);

-- Executar migração novamente
```

---

## 🎯 APÓS A MIGRAÇÃO

✅ **Todos os relatórios** (antigos e novos) serão gerados com:
- Dados REAIS das respostas originais
- Métricas ATUAIS configuradas pelo admin
- Interpretações PERSONALIZADAS
- Faixas customizadas

✅ **Clientes podem re-baixar** seus relatórios PDF e terão a versão correta!

---

## 📞 SUPORTE

Em caso de dúvidas ou problemas:
1. Verificar logs do script
2. Executar queries de verificação manual
3. Contactar o desenvolvedor

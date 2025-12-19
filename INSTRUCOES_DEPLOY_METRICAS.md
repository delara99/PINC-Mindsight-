# 🚀 INSTRUÇÕES DE DEPLOY - CORREÇÃO DE MÉTRICAS

## ⚠️ IMPORTANTE: MIGRAÇÃO DE BANCO DE DADOS NECESSÁRIA

### **PASSO 1: Aplicar Migração SQL**

Execute o seguinte SQL no banco de dados de produção:

```sql
-- Adicionar coluna configId em assessment_assignments
ALTER TABLE `assessment_assignments` ADD COLUMN `configId` VARCHAR(191) NULL;

-- Adicionar chave estrangeira
ALTER TABLE `assessment_assignments` 
ADD CONSTRAINT `assessment_assignments_configId_fkey` 
FOREIGN KEY (`configId`) REFERENCES `bigfive_configs`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;
```

### **PASSO 2: Atualizar Assignments Existentes** 

Após aplicar a migração acima, vincule os assignments existentes à configuração ativa:

```sql
-- Para cada tenant, vincular assignments à config ativa
UPDATE assessment_assignments aa
JOIN bigfive_configs bc ON bc.isActive = 1
JOIN users u ON u.id = aa.userId
SET aa.configId = bc.id
WHERE bc.tenantId = u.tenantId
AND aa.configId IS NULL;
```

### **PASSO 3: Verificar Migração**

```sql
-- Verificar que todos os assignments têm configId
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN configId IS NULL THEN 1 ELSE 0 END) as sem_config,
    SUM(CASE WHEN configId IS NOT NULL THEN 1 ELSE 0 END) as com_config
FROM assessment_assignments;
```

Resultado esperado:
- `sem_config` deve ser 0
- `com_config` deve ser igual a `total`

### **PASSO 4: Deploy do Backend**

O código já foi commitado e enviado. O Railway/Vercel irá fazer deploy automaticamente.

### **PASSO 5: Gerar Prisma Client em Produção**

Se necessário, execute no servidor:
```bash
cd backend
npx prisma generate
```

---

## ✅ VERIFICAÇÕES PÓS-DEPLOY

### **1. Testar Criação de Novo Inventário**
- Login como usuário
- Iniciar inventário Big Five
- Verificar no banco que o `configId` foi preenchido

### **2. Testar Download de Relatório**
- Completar um inventário
- Fazer download do PDF
- Verificar que os dados são REAIS (não mock)
- Verificar que as interpretações seguem a config do admin

### **3. Verificar Métricas no Admin**
- Login como admin
- Acessar "Métricas de Avaliação"
- Editar uma configuração
- Criar novo inventário
- Verificar que usa a nova configuração

---

## 🔧 ROLLBACK (se necessário)

Se algo der errado, execute:

```sql
-- Remover constraint
ALTER TABLE `assessment_assignments` 
DROP FOREIGN KEY `assessment_assignments_configId_fkey`;

-- Remover coluna
ALTER TABLE `assessment_assignments` DROP COLUMN `configId`;
```

---

## 📋 CHECKLIST FINAL

- [ ] SQL migration aplicada
- [ ] Assignments vinculados a configs
- [ ] Backend deployed
- [ ] Prisma client regenerado
- [ ] Novo inventário funciona
- [ ] Download de relatório funciona
- [ ] Dados são reais (não mock)
- [ ] Métricas configuradas pelo admin são aplicadas

---

## 🚨 EM CASO DE ERRO

Se encontrar algum erro após o deploy:

1. Verificar logs do Railway/Vercel
2. Verificar se a migração SQL foi aplicada corretamente
3. Verificar se existe ao menos uma `bigfive_config` com `isActive = true` para cada tenant
4. Contactar o desenvolvedor

---

## 📞 SUPORTE

Para qualquer dúvida ou problema, consultar o arquivo `AUDITORIA_METRICAS.md` que contém todos os detalhes técnicos das correções implementadas.

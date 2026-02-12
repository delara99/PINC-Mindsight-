# GUIA DE TESTE - RELATÓRIOS CORRIGIDOS

## ✅ CORREÇÕES APLICADAS

1. **Backend do Especialista** - Agora retorna scores salvos no formato `calculatedScores`
2. **Frontend do Cliente** - Já estava correto, usando score do backend
3. **Backend do Cliente** - Já estava correto, lendo do banco

## 🧪 COMO TESTAR

### 1. Aguarde o Deploy (2-3 minutos)
- Railway está fazendo deploy do backend
- Vercel está fazendo deploy do frontend

### 2. Limpe o Cache do Navegador
**MUITO IMPORTANTE!** O navegador pode estar mostrando dados antigos.

**Chrome/Edge:**
- Pressione `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- Ou: `Ctrl + F5`

**Firefox:**
- Pressione `Ctrl + Shift + R`

**Safari:**
- Pressione `Cmd + Option + R`

### 3. Acesse os Relatórios

**Relatório do Cliente (TalkingTO):**
- URL: `https://pinc.app.br/dashboard/devolutiva`
- Deve mostrar: **55, 51, 44, 47** (e o 5º valor)

**Relatório do Especialista:**
- URL: `https://pinc.app.br/dashboard/reports/[id]`
- Deve mostrar: **55, 51, 44, 47** (e o 5º valor)
- Agora deve ter DADOS (não mais vazio)

## 📊 VALORES ESPERADOS

Ambos os relatórios devem mostrar **EXATAMENTE** os mesmos números:

| Dimensão | Score Oficial |
|----------|---------------|
| OPENNESS (Concreto-Abstrato) | **55** |
| NEUROTICISM (Emoção-Razão) | **51** |
| EXTRAVERSION (Introversão-Extroversão) | **44** |
| AGREEABLENESS (Lógico-Sentimental) | **47** |
| CONSCIENTIOUSNESS (Adaptável-Estruturado) | **(verificar)** |

## ❌ SE AINDA ESTIVER ERRADO

1. **Verifique se o deploy finalizou:**
   - Railway: https://railway.app
   - Vercel: https://vercel.com

2. **Limpe COMPLETAMENTE o cache:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Ou use modo anônimo/incógnito

3. **Verifique o console do navegador:**
   - F12 → Console
   - Procure por erros em vermelho
   - Me envie screenshot se houver erros

## 🔍 VERIFICAÇÃO ADICIONAL

Se quiser confirmar que os dados estão corretos no backend:

```bash
# Acesse diretamente a API (substitua [ID] pelo ID do assignment)
curl https://pinc-mindsight-production.up.railway.app/api/v1/assessments/assignments/7e13511d-02fc-4374-8e5e-d9f4f003fc5c \
  -H "Authorization: Bearer SEU_TOKEN"
```

Deve retornar JSON com `calculatedScores.scores` contendo os valores corretos.

## 📝 CHECKLIST

- [ ] Deploy do Railway finalizado
- [ ] Deploy do Vercel finalizado
- [ ] Cache do navegador limpo (Ctrl+Shift+R)
- [ ] Relatório do Especialista mostra dados
- [ ] Relatório do Cliente mostra dados
- [ ] Ambos mostram os mesmos números
- [ ] Números batem com o banco: 55, 51, 44, 47

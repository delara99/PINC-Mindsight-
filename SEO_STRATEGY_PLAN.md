# 🚀 ESTRATÉGIA DE SEO & GROWTH AVANÇADO - PINC

**Status:** Implementado (Fase 1 - Técnica) e Planejado (Fase 2 - Conteúdo & Expansão).
**Data:** 27/01/2026

Este documento detalha o diagnóstico atual da PINC e o roteiro para dominar as buscas orgânicas e de IA.

---

## 🛠️ 1. DIAGNÓSTICO INICIAL (REALIZADO)

### ✅ Pontos Ajustados (Fase 1 - Imediata)
- **Sitemap.xml**: Implementado dinamicamente (`/sitemap.xml`).
- **Robots.txt**: Configurado para orientar crawlers e proteger áreas administrativas (`/robots.txt`).
- **Metadata Base**: Implementada no `layout.tsx` com OpenGraph, Twitter Cards e definições padrão.
- **Schema.org**: Adicionado JSON-LD Estruturado (`SoftwareApplication`) em todas as páginas via Root Layout.
- **Canônicos**: Next.js App Router gerencia automaticamente via `metadataBase`.

### ⚠️ Oportunidades Identificadas (To-Do)
- **H1 Único**: Algumas páginas podem estar sem H1 definido ou com múltiplos H1s.
- **Imagens**: Falta de `alt` text descritivo em imagens decorativas ou de conteúdo.
- **Páginas Específicas**: As páginas `/business`, `/help` e `/admin` precisam de meta tags personalizadas (hoje herdam o padrão).
- **Conteúdo Semântico**: O site foca muito na funcionalidade e pouco na educação (falta um `/blog` ou `/guia`).

---

## 🗺️ 2. ROTEIRO DE IMPLEMENTAÇÃO (STEP-BY-STEP)

Esta estratégia foca em E-E-A-T (Experiência, Expertise, Autoridade, Confiança) e preparação para IA (GEO).

### FASE 2: CONTENT CLUSTERS (SEMÂNTICA)
*Objetivo: Dominar tópicos, não apenas palavras-chave.*

Criação de clusters de conteúdo para capturar tráfego topo de funil:

#### 🟢 Cluster 1: Autoconhecimento (B2C)
- **Pillar Page**: "O Que é o Big Five e Por Que Ele é a Ciência da Personalidade?"
- **Satélites**:
  - "Neuroticismo: Como controlar a ansiedade segundo o Big Five"
  - "Extroversão vs Introversão: Mitos e verdades"
  - "Como o Big Five ajuda na escolha da carreira"

#### 🔵 Cluster 2: RH e Cultura (B2B)
- **Pillar Page**: "Guia Completo de Fit Cultural e Avaliação Comportamental para Empresas"
- **Satélites**:
  - "Reduzindo turnover com contratações baseadas em dados"
  - "Soft Skills mais valorizadas em 2026"
  - "Como usar IA no recrutamento sem perder a humanização"

> **Ação Recomendada**: Criar diretório `/blog` ou `/aprender` usando Next.js + MDX ou CMS Headless.

### FASE 3: SEO PARA CONVERSÃO (CRO)
*Objetivo: Transformar leitores em usuários.*

- **Otimização de Landing Pages**:
  - Revisar Copy da Home para focar em "Dor" -> "Solução" -> "Prova".
  - Adicionar FAQs com Schema `FAQPage` nas páginas de planos.
  - Inserir "Rich Snippets" de Avaliação (`aggregateRating`) visíveis.

### FASE 4: PREPARAÇÃO PARA IA (GEO - Generative Engine Optimization)
*Objetivo: Ser citado pelo ChatGPT, Gemini e Google SGE.*

- **Estrutura de Citação**:
  - Criar definições claras e diretas ("O PINC é...", "O Big Five mede...").
  - Usar listas e tabelas comparativas (IA adora tabelas).
  - Publicar estatísticas próprias (ex: "Dados anonimizados da PINC mostram que...").

---

## 🔧 GUIA TÉCNICO PARA DESENVOLVEDORES (Manutenção)

### Como Adicionar SEO em Novas Páginas

No Next.js App Router, adicione o objeto `metadata` em cada `page.tsx`:

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Título da Página | PINC",
    description: "Descrição otimizada para clique (CTR) com 150-160 caracteres.",
    openGraph: {
        title: "Título Social Forte",
        description: "Descrição para LinkedIn/WhatsApp",
        images: ["/url-da-imagem-especifica.png"]
    }
};

export default function Page() { ... }
```

### Checklist de Publicação

1. [ ] A página tem **um único H1**?
2. [ ] A URL é amigável? (ex: `/teste-big-five` e não `/teste?id=123`)
3. [ ] Todas as imagens têm `alt="..."`?
4. [ ] O tempo de carregamento (LCP) está abaixo de 2.5s?
5. [ ] O conteúdo responde à intenção de busca do usuário?

---

**Próximos Passos Sugeridos para o Usuário:**
1. Validar este plano.
2. Autorizar a criação da estrutura de Blog (`/app/blog`).
3. Fornecer textos bases para os artigos 'Pillar'.

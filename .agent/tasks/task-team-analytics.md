# Task: Implementação do Módulo de Análise de Equipe (Team Fit)

## Objetivo
Criar um motor de inteligência que analise a compatibilidade de um candidato com uma equipe existente, focando em diversidade cognitiva, complementariedade e riscos de conflito.

## 1. Backend (API & Core)

### 1.1. Team Service (`team.service.ts`)
- [ ] **CRUD de Equipes:** Criar, Editar, Listar Times (Nome, Gestor, Membros).
- [ ] **Agregador de Scores:** Função que calcula a "Personalidade do Time" (Média dos Big Five dos membros).
- [ ] **Diversidade Score:** Calcular variância/desvio padrão para saber se o time é homogêneo ou heterogêneo.

### 1.2. Engine de Team Fit (`talent-intelligence.service.ts` - update)
- [ ] **Cálculo de Sinergia:** 
    - Se Time tem baixa Conscienciosidade e Candidato tem Alta -> Sinergia (Complementar).
    - Se Time tem Alta e Candidato Baixa -> Risco (Fricção).
- [ ] **Alerta de Gestor:** Cruzamento específico 1:1 entre Candidato e Líder do Time.

## 2. Frontend (UI/UX)

### 2.1. Gestão de Equipes (Simples)
- [ ] Tela para criar times e adicionar colaboradores (seleção múltipla do banco de usuários).

### 2.2. Simulador de Equipe (Dentro da Vaga)
- [ ] Dropdown "Simular neste Time..." no card do candidato.
- [ ] **Gráfico Comparativo:** Linha do Candidato vs Área Sombreada da Equipe (Média + Desvio).
- [ ] **Cards de Insights:**
    - "Motor de Execução": Candidato eleva a média de Conscienciosidade do time em 15%.
    - "Risco de Choque": Candidato muito mais Extrovertido que a média (possível isolamento ou liderança natural).

## 3. Fluxo de Uso Proposto
1. O Gestor entra na Vaga.
2. Vê o Ranking Individual (já feito).
3. Clica em um botão "Simulação de Time" no topo.
4. O sistema mostra: "Se você contratar **Gilda**, o time ficará **10% mais Estável**, mas **5% menos Inovador**".

---
**Aprovação:**
Voce concorda com essa estrutura? Quer focar primeiro no **Visual** (Simulador) usando dados mockados de time, ou prefere criar o **Cadastro de Times** real primeiro?

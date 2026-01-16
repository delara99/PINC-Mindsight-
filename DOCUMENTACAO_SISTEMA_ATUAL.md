# Documentação Técnica do Sistema de Avaliação (Estado Atual)

## 1. Visão Geral da Arquitetura
O sistema atual opera em um modelo **Híbrido**.
- **Estrutura de Relatório (Output):** Baseada estritamente no modelo científico **Big Five (OCENA)** padrão, que exige 5 Grandes Traços e 30 Facetas (6 facetas por traço).
- **Instrumento de Coleta (Input):** Baseado no questionário **TalkingTo**, que possui sua própria taxonomia (Traços, Dicotomias e Subtraços).

## 2. O Desafio da Integração (O "De-Para")
Como o questionário TalkingTo não foi desenhado nativamente para preencher as exatas 30 facetas do Big Five acadêmico, o sistema realiza uma **tradução técnica** (Mapeamento) para gerar os relatórios.

### Estruturas Comparadas:

| Estrutura Big Five (Sistema) | Estrutura TalkingTo (Questionário) |
| ---------------------------- | ---------------------------------- |
| **5 Grandes Traços** (Scores Agregados) | **5 Traços** (Equivalentes) |
| **30 Facetas** (6 por Traço) | **Dicotomias** (Ex: Introversão-Extroversão) |
| *Ex: Gregariedade, Assertividade, etc.* | **Subtraços** (Ex: Falante, Seletivo, Ativo) |

### 3. Lógica de Cálculo e Mapeamento Atual

Para gerar o gráfico de Radar e as Barras de Facetas, o sistema opera na seguinte lógica:

#### A. Captura e Peso
Cada pergunta respondida pelo candidato tem:
- **Valor:** 1 a 5 (Escala Likert).
- **Peso:** Positivo (+1) ou Inverso (-1).
    - *Exemplo:* "Gosto de festas" (Peso 1). "Prefiro ficar sozinho" (Peso -1).

#### B. Mapeamento de Facetas (A Adaptação)
Como o TalkingTo possui subtraços como "Falante" e "Ouvinte", e o Big Five possui a faceta "Gregariedade", o sistema realiza o seguinte vínculo lógico:

1.  **Agrupamento:** O sistema pega todas as perguntas de um subtraço TalkingTo (ex: "Inseguro").
2.  **Distribuição:** Como um subtraço do TalkingTo é abrangente, ele alimenta múltiplas facetas do Big Five para preencher o relatório.
    - *Exemplo Prático:* Perguntas do subtraço **"Inseguro"** são usadas para calcular pontuações nas facetas **"Depressão"**, **"Vulnerabilidade"** e **"Embaraço"** do Big Five.
    - *Exemplo Prático:* Perguntas do subtraço **"Falante"** alimentam a faceta **"Gregariedade"**.

Essa distribuição garante que todas as 30 barras do relatório Big Five recebam dados, gerando um perfil visualmente completo, mesmo que a granularidade original do questionário seja diferente.

#### C. Cálculo Final
1.  **Score da Faceta:** Média ponderada de todas as perguntas vinculadas àquela faceta. Convertido para escala 0-100.
2.  **Score do Traço:** Média aritmética das 6 facetas que compõem o traço.

## 4. Onde Queremos Chegar (Proposta TalkingTo 100%)
O objetivo da alteração futura é remover a "máscara" do Big Five Acadêmico (as 30 facetas rígidas) e apresentar os resultados nativos do TalkingTo.

**Mudança sugerida:**
- **Abandonar:** As 30 Facetas padrão (ex: Gregariedade, Modéstia, Ponderação).
- **Adotar:** As Dicotomias e Subtraços reais (ex: Ouvinte vs. Falante, Crítico vs. Tolerante).

Isso eliminará a necessidade de redistribuição de perguntas e tornará o cálculo 100% fiel à intenção original do questionário TalkingTo.

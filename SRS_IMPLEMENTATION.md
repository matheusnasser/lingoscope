# Sistema de Repetição Espaçada (SRS) - Implementação

## ✅ O que foi implementado

### 1. Banco de Dados
- **Tabela `review_items`**: Gerencia o sistema SRS com algoritmo SM-2 simplificado
- Campos principais:
  - `vocabulary_base` / `vocabulary_target`: Palavras para revisar
  - `interval_days`: Dias até próxima revisão
  - `ease_factor`: Fator de facilidade (padrão 2.5)
  - `repetitions`: Número de revisões consecutivas bem-sucedidas
  - `next_review_at`: Data chave para agendamento
  - `difficulty_level`: new, learning, mastered

### 2. Serviço SRS (`src/services/srs/srsService.ts`)
- `getDueReviews()`: Busca itens que precisam ser revisados hoje
- `getDueReviewCount()`: Conta quantos itens estão pendentes
- `createReviewItem()`: Cria novo item de revisão (agendado para amanhã)
- `processReview()`: Processa uma revisão e atualiza algoritmo SRS
- `getAllReviewItems()`: Lista todos os itens do usuário
- `getReviewStats()`: Estatísticas de revisão

### 3. Tela de Revisão (`src/screens/ReviewScreen/index.tsx`)
- Interface estilo flashcard
- Mostra imagem borrada até revelar resposta
- Botões de nota: Again, Hard, Good, Easy
- Limite de 10 revisões/dia para usuários free
- Ilimitado para premium

### 4. Integração Automática
- Quando uma análise é concluída, automaticamente cria um `review_item`
- Agendado para revisão no dia seguinte (1 dia)
- Linkado ao post original

## Algoritmo SRS (SM-2 Simplificado)

### Grades e Intervalos:

- **Again**: Intervalo = 0 (revisa em 10 minutos), ease_factor - 0.2, repetitions = 0
- **Hard**: Intervalo = 1 dia, ease_factor - 0.15, repetitions - 1
- **Good**: 
  - Se repetitions = 0: 1 dia
  - Se repetitions = 1: 3 dias
  - Senão: interval_days × ease_factor
- **Easy**: 
  - Se repetitions = 0: 2 dias
  - Se repetitions = 1: 5 dias
  - Senão: interval_days × ease_factor × 1.3

### Níveis de Dificuldade:
- **new**: repetitions = 0
- **learning**: 0 < repetitions < 3 ou interval < 7 dias
- **mastered**: repetitions ≥ 3 e interval ≥ 7 dias

## Modelo de Negócio Atualizado

### Free Tier
- ✅ 1 foto por dia (Daily Drop)
- ✅ SRS funciona, mas limitado a **10 revisões por dia**
- ❌ Example phrases (premium only)

### Premium Tier ($9.99/mês ou $99.99/ano)
- ✅ Practice Mode ilimitado (fotos quando quiser)
- ✅ Revisões SRS ilimitadas
- ✅ Example phrases
- ✅ Priority support

## Próximos Passos

1. **Testar o fluxo completo**:
   - Capturar foto → Análise → Review item criado
   - Revisar item → Processar nota → Próxima revisão agendada

2. **Melhorias futuras**:
   - Notificações push para revisões pendentes
   - Estatísticas de progresso (gráficos)
   - Modo de estudo em lote
   - Exportar dados de revisão

3. **Otimizações**:
   - Cache de revisões pendentes
   - Pré-carregar próximos itens
   - Animações de transição

## Arquivos Criados/Modificados

### Novos:
- `supabase/migrations/004_create_review_items.sql`
- `src/services/srs/srsService.ts`
- `src/screens/ReviewScreen/index.tsx`
- `SRS_IMPLEMENTATION.md`

### Modificados:
- `src/navigation/HomeTabsNavigator.tsx` (adicionada aba Review)
- `src/screens/AnalysisResultScreen/index.tsx` (cria review_item automaticamente)

## Como Usar

1. **Capturar foto**: O app analisa e cria automaticamente um review_item
2. **Revisar**: Vá para a aba "Review" e revise os itens pendentes
3. **Avaliar**: Escolha Again/Hard/Good/Easy baseado em quão bem lembrou
4. **Repetir**: O sistema agenda automaticamente a próxima revisão

O sistema aprende com você: itens fáceis aparecem menos frequentemente, itens difíceis aparecem mais.








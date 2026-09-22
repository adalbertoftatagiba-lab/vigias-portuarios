# Projeto: Aplicativo de Folha de Pagamento — Vigia Portuário

> Este documento reúne todas as especificações combinadas até aqui em conversas com o Claude no chat.
> Coloque este arquivo na raiz da pasta do projeto (ex: como `CLAUDE.md` ou `PROJETO.md`) e mantenha
> os arquivos-modelo listados na seção "Arquivos de referência" na mesma pasta, para que o Claude Code
> tenha acesso a tudo isso automaticamente.

## 1. Objetivo

Aplicativo web para calcular a folha de pagamento de Vigias Portuários (trabalhadores avulsos) e
gerar automaticamente os relatórios de cobrança correspondentes, substituindo o cálculo manual em
planilhas Excel.

## 2. Contexto do negócio

- Vigia Portuário é escalado para trabalhar em navios específicos, em turnos de 6 horas:
  - **Diurno:** 07h–13h e 13h–19h
  - **Noturno:** 19h–01h e 01h–07h
  - O primeiro turno do dia é o de 07h–13h.
  - **Regra importante:** o turno das 01h às 07h é classificado (dia útil/sábado/domingo/feriado)
    pela data do **dia anterior**, conforme convenção definida pelos Portos do RJ para divisão dos
    períodos do dia.
- O valor de cada turno varia por período (dia/noite) e por tipo de dia (segunda a sexta, sábado,
  domingo, feriado). Esses valores vêm da tabela de tarifas do sindicato (`Tabela_salario_vigia.xlsx`).
- O navio pode estar **atracado** no porto ou **ao largo** (aguardando vaga). Um mesmo navio/operação
  pode alternar entre os dois estados ao longo do período.
- Portos/cidades envolvidos: **Rio de Janeiro, Itaguaí e Mangaratiba**.
- A cobrança é feita por período trabalhado (turno de 6h), agrupada por operação (navio + agência).
- IRRF é sempre tratado como **zero** (não atinge a faixa mínima de retenção).
- Percentuais de itens de cobrança em alguns relatórios já foram alterados manualmente caso a caso
  no passado (por causa de arrendamentos) — mas isso são **acertos pontuais por arredondamento**, não
  a regra padrão. A regra padrão é: **sempre seguir os percentuais da `Tabela_salario_vigia.xlsx`**.

## 3. Fluxo de dados

1. Cadastro de vigias (matrícula + nome) — `cadastro_vigia.xlsx`
2. Cadastro de agências de navegação (CNPJ, razão social, endereço, CEP, cidade/UF, telefone,
   e-mail) — `tabela_agencias.xlsx` (7 agências cadastradas)
3. Tabela de tarifas do sindicato por turno — `Tabela_salario_vigia.xlsx`
4. Lista de feriados (nacionais + Rio de Janeiro) — `Feriados.docx`, ano de referência: **2026**
   - Carnaval 2026 confirmado: **17/02/2026** (terça-feira)
5. Apontamento diário (tela de digitação a ser construída), com os campos:
   - Matrícula do vigia
   - Data da operação
   - Período (turno)
   - Nome da embarcação/navio
   - Local do navio (atracado / ao largo)
   - Porto/cidade
   - Nome da agência de navegação/operador portuário
6. Sistema gera **4 relatórios por operação** (navio + agência):
   - Folha de Pagamento
   - Relatório de Faturamento
   - Fatura de Serviços
   - Nota de Débito

## 4. Regras de cálculo — Folha de Pagamento

Baseado no modelo `Folha.xlsx` (ver arquivo de referência para layout exato).

Campos de apontamento por vigia: Matrícula, Nome (busca automática pela matrícula), Período
(inicial/final/tipo dia-noite), Total de Horas, Valor da Hora (vem da tabela do sindicato),
MMO Bruta (= Horas × Valor Hora), Tipo de Dia, Movimentação (ex: REEMBARQUE).

| Item | Fórmula |
|---|---|
| R.S.R | MMO Bruta × 0,1818 |
| Total (Proventos) | MMO + R.S.R |
| INSS | (Total + Férias) × 0,11 |
| DAS | Total × 0,0488 |
| 13º Salário | Total × 0,0909 |
| Férias | Total × 0,1212 |
| FGTS | Total × 0,097 |
| INSS Patronal | Total × 0,28713 |
| Líquido MMO | Total − INSS − IRRF − DAS − Pensão + Crédito − Débito |
| IRRF | sempre 0 |

⚠️ **Os percentuais acima (0,1818 / 0,11 / 0,0488 / 0,0909 / 0,1212 / 0,097 / 0,28713) devem ser
extraídos e validados contra a `Tabela_salario_vigia.xlsx`, não hardcoded**, pois essa é a fonte
oficial segundo o usuário.

## 5. Regras de cálculo — Relatórios de Cobrança

Baseado no modelo `Relatórios_de_cobrança.xlsx` (3 abas), ver arquivo de referência para layout exato.

### 5.1 Relatório de Faturamento (aba base — dados do navio/porto, agência, custos)
- MMO Vigias = soma da MMO Bruta de todos os vigias da operação
- Encargos = MMO Vigias × 0,5962 (= Previdência Patronal 0,2871 + 13º 0,0909 + Férias 0,1212 + FGTS 0,097)
- Sub Total = MMO Vigias + Encargos
- Administração = Sub Total × 0,9 (taxa de administração do sindicato)
- Benefícios = VT + VR, calculados por (nº de períodos/turnos × valor unitário)
- Total = Sub Total + Administração + Benefícios

### 5.2 Fatura de Serviços
- Puxa dados cadastrais da aba de Faturamento (prestador = sindicato, tomador = agência)
- Cobra **apenas o valor de Administração** (receita do sindicato pela intermediação)

### 5.3 Nota de Débito
- Puxa dados cadastrais da aba de Faturamento
- Cobra **Sub Total (MMO + Encargos) + Benefícios (VT + VR)** — ou seja, o repasse do custo real
  com os vigias, que o sindicato apenas intermedia

## 6. Decisões de arquitetura já tomadas

- **Formato final:** aplicativo web (não planilha Excel) — tela de apontamento diário + geração
  automática de relatórios.
- **Stack:**
  - Frontend: **Next.js + TypeScript** (com API routes para o backend)
  - Banco de dados: **Postgres ou SQLite** (a decidir/definir durante a implementação; SQLite é
    suficiente para o volume esperado e mais simples de manter)
  - Geração de relatórios: **exceljs**, para replicar fielmente o layout dos arquivos-modelo
  - Hospedagem sugerida: **Vercel** (frontend/API) + banco gerenciado (Neon/Supabase, se Postgres)

## 7. Arquivos de referência (devem estar na mesma pasta do projeto)

| Arquivo | Conteúdo |
|---|---|
| `cadastro_vigia.xlsx` | Matrícula + nome dos vigias — **usuário precisa reanexar, não disponível nesta sessão** |
| `Tabela_salario_vigia.xlsx` | Tabela de tarifas do sindicato por turno — **usuário precisa reanexar, não disponível nesta sessão** |
| `Folha.xlsx` | Modelo/layout da Folha de Pagamento — disponível, copiado para esta pasta |
| `Relatórios_de_cobrança.xlsx` | Modelo/layout dos 3 relatórios de cobrança — disponível, copiado para esta pasta |
| `tabela_agencias.xlsx` | Cadastro das 7 agências de navegação — disponível, copiado para esta pasta |
| `Feriados.docx` | Lista de feriados 2026 (nacional + RJ) — disponível, copiado para esta pasta |

## 8. Pontos ainda em aberto

- Confirmar se o banco será Postgres ou SQLite.
- Definir formato de saída dos relatórios: Excel (.xlsx, fiel ao modelo) ou PDF.
- Revisar os percentuais reais na `Tabela_salario_vigia.xlsx` assim que reanexada, para confirmar
  se batem com os valores hardcoded observados nos modelos (0,1818 / 0,11 / 0,0488 / 0,0909 /
  0,1212 / 0,097 / 0,28713 / 0,5962 / 0,9).

## 9. Estado atual e histórico de correções relevantes

> Seções 1–8 são o documento original de especificação. O sistema já está em produção (Next.js +
> Postgres/Neon, hospedado na Vercel, repositório GitHub `adalbertoftatagiba-lab/vigias-portuarios`).
> Esta seção registra decisões e correções feitas depois que o sistema já estava rodando, para que
> fiquem preservadas independente da conversa que as gerou.

### 9.1 Folha de Pagamento — uma página por turno (não por vigia)

Antes, a Folha de Pagamento agrupava **todos os turnos de um mesmo vigia numa operação** em uma
única página/cálculo — se o vigia trabalhasse 2 ou 3 turnos na mesma operação, eles apareciam juntos
numa só folha, com um total combinado. Isso está **incorreto**: a regra confirmada com o usuário é
que **cada turno trabalhado gera sua própria folha individual**, com seu próprio cálculo de MMO
Bruta/R.S.R/INSS/DAS/etc., mesmo que seja o mesmo vigia na mesma operação.

- Implementado em `lib/relatorios/dados.ts` (novo campo `resultadosPorTurno`, um resultado por
  apontamento) e `lib/relatorios/folha.tsx` (uma `PaginaVigia` por turno).
- O ajuste manual (Pensão/Crédito/Débito), lançado uma vez por vigia por operação, entra só na folha
  do **último turno** do vigia naquela operação — para não duplicar o desconto/crédito em cada folha.
- O resumo "Folha por vigia" (tela de Relatórios) e o cálculo do Relatório de Faturamento continuam
  agregados por vigia — isso não mudou, pois servem para a cobrança da agência, não para a folha
  individual do vigia.

### 9.2 "Sortear automaticamente" travava o sistema (erro de servidor)

Ao criar uma operação nova com "Sortear automaticamente" marcado, a página quebrava com uma tela de
erro genérica. Foram encontradas e corrigidas **três causas reais e distintas** ao longo da
investigação (a primeira tentativa de correção nem sempre acerta a causa raiz de primeira):

1. **Intervalo de data/período invertido**: se "Data final" ficasse antes de "Data inicial" (ou o
   "Último período trabalhado" antes do "Período em que o trabalho começou"), o sistema tentava gerar
   até ~1500 apontamentos de uma vez, sem validar. Corrigido: o sistema agora recusa intervalos
   inválidos antes de criar a operação (`lib/tipos.ts`: `enumerarPeriodos`/`intervaloEmOrdem`).
2. **Timeout de função serverless com banco frio**: o Neon (banco Postgres) "dorme" após um tempo sem
   uso; o modo ALEATORIO encadeia várias idas ao banco numa mesma requisição, o que podia passar do
   tempo limite padrão. Aumentado `maxDuration` para 30s nas páginas relevantes, e o sorteio
   automático ficou protegido por `try/catch` (a operação é criada mesmo que o sorteio falhe; dá pra
   completar os períodos pendentes depois, pelo botão que já existe na tela de apontamentos).
3. **Causa raiz real deste incidente**: o contador `Configuracao.proximoNumero` (campo "Próximo
   número a ser usado" na tela **Configurações**) tinha sido editado manualmente para um valor **mais
   baixo** que o maior número de operação já existente — cada tentativa de criar uma operação nova
   colidia com um número já em uso (`Unique constraint failed on the fields: ('numero')`), e como a
   transação sempre revertia nesse ponto, o contador nunca avançava, então o erro se repetia idêntico
   a cada tentativa. **Corrigido definitivamente**: `lib/numeracao.ts` (`proximoNumeroSequencial`)
   agora calcula o próximo número a partir do maior valor **realmente em uso** (não só do contador
   salvo), se autocorrigindo sozinho diante de qualquer dessincronia — edição manual errada na tela de
   Configurações, uma futura migração de dados, etc.
4. Também foi adicionado: se a criação de uma operação falhar por qualquer outro motivo não previsto,
   a mensagem de erro real aparece num aviso na tela `/operacoes` (em vez de uma tela de erro
   genérica), o que foi o que permitiu identificar a causa raiz nº 3 acima.

**Lição operacional:** o campo "Próximo número a ser usado" em Configurações deve ser sempre maior
que o número da última operação criada (a própria tela mostra esse valor de referência). Depois da
correção 9.2.3, o sistema não deve mais travar mesmo que esse campo seja editado incorretamente — mas
o valor exibido lá pode ficar "adiantado" em relação ao esperado, já que agora ele se ajusta sozinho.

### 9.3 Infraestrutura

- **Hospedagem:** Vercel (deploy automático a cada merge no branch `main`).
- **Banco de dados:** Neon (Postgres gerenciado), acessado via `@prisma/adapter-neon` — não é um
  produto próprio da Vercel, é um serviço separado (Neon) comumente usado junto com ela.
- **Atualização de dados de referência** (tabela de tarifas do sindicato, cadastro de vigias, lista de
  feriados etc.): processo separado, feito localmente pelo usuário — extrai um zip com os arquivos
  `.xlsx`/`.docx` atualizados por cima dos existentes na raiz do repositório, e roda
  `npx tsx prisma/seed.ts` (ou o script de migração equivalente) para carregar no banco. Não tem
  relação com deploy de código nem precisa de PR.

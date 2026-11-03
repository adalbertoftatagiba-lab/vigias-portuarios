export const LOCAIS = ["ATRACADO", "AO_LARGO"] as const;
export type Local = (typeof LOCAIS)[number];

export const TIPOS_DIA = ["UTIL", "SABADO", "DOMINGO", "FERIADO"] as const;
export type TipoDia = (typeof TIPOS_DIA)[number];

export const PERIODOS = ["DIA", "NOITE"] as const;
export type Periodo = (typeof PERIODOS)[number];

export const LOCAL_LABEL: Record<Local, string> = {
  ATRACADO: "Atracado",
  AO_LARGO: "Ao Largo",
};

export const TIPO_DIA_LABEL: Record<TipoDia, string> = {
  UTIL: "Dia útil",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
  FERIADO: "Feriado",
};

export const PERIODO_LABEL: Record<Periodo, string> = {
  DIA: "Dia",
  NOITE: "Noite",
};

// Janelas de turno (hora inicial-final) por porto.
// RJ usa grade própria; Itaguaí e Mangaratiba compartilham a mesma grade (Tabela salario vigia.xlsx).
export type JanelaTurno = { periodo: Periodo; inicial: number; final: number };

export const GRADE_RJ: JanelaTurno[] = [
  { periodo: "DIA", inicial: 7, final: 13 },
  { periodo: "DIA", inicial: 13, final: 19 },
  { periodo: "NOITE", inicial: 19, final: 1 },
  { periodo: "NOITE", inicial: 1, final: 7 },
];

export const GRADE_ITAGUAI: JanelaTurno[] = [
  { periodo: "DIA", inicial: 8, final: 14 },
  { periodo: "DIA", inicial: 14, final: 20 },
  { periodo: "NOITE", inicial: 20, final: 2 },
  { periodo: "NOITE", inicial: 2, final: 8 },
];

const PORTOS_GRADE_ITAGUAI = ["ITAGUAI", "ITAGUAÍ", "MANGARATIBA"];

export function gradeDoPorto(porto: string): JanelaTurno[] {
  return PORTOS_GRADE_ITAGUAI.includes(porto.trim().toUpperCase()) ? GRADE_ITAGUAI : GRADE_RJ;
}

// Rótulo genérico de slot (0-3), usado onde o porto ainda não está fixado (ex: formulário
// de criação da operação, em que porto e período são escolhidos ao mesmo tempo) — a ordem
// e o padrão Dia/Dia/Noite/Noite é igual em todas as grades, só a hora exata muda por porto.
export const ROTULOS_SLOT_GENERICO = ["1º Período (Dia)", "2º Período (Dia)", "3º Período (Noite)", "4º Período (Noite)"];

/** Rótulo de um slot já com a hora exata, quando o porto é conhecido (ex: listagens). */
export function rotuloSlotComHora(porto: string, slot: number): string {
  const janela = gradeDoPorto(porto)[slot];
  if (!janela) return "-";
  const hora = (h: number) => String(h).padStart(2, "0") + "h";
  return `${hora(janela.inicial)}–${hora(janela.final)} (${PERIODO_LABEL[janela.periodo]})`;
}

/**
 * Índice do slot (0-3) de um apontamento a partir da hora inicial do turno.
 * Necessário para ordenar apontamentos na sequência real do dia (1º a 4º
 * período): o 4º período (madrugada, ex: 01h–07h) tem hora inicial MENOR que
 * o 1º (ex: 07h–13h), então ordenar direto pela hora colocaria a madrugada
 * antes — aqui ela fica corretamente por último.
 */
export function slotDoApontamento(porto: string, periodoInicial: number): number {
  const indice = gradeDoPorto(porto).findIndex((j) => j.inicial === periodoInicial);
  return indice === -1 ? 0 : indice;
}

/** Posição ordinal de um período (data + slot) na sequência do tempo — permite
 * comparar dois pontos (data, slot) sem percorrer a grade dia a dia. */
function ordinalPeriodo(data: Date, slot: number): number {
  return Math.round(data.getTime() / 86400000) * 4 + slot;
}

/** true se (dataFinal, slotFinal) vem depois (ou é igual a) (dataInicial, slotInicial). */
export function intervaloEmOrdem(dataInicial: Date, slotInicial: number, dataFinal: Date, slotFinal: number): boolean {
  const inicio = ordinalPeriodo(dataInicial, slotInicial);
  const fim = ordinalPeriodo(dataFinal, slotFinal);
  return Number.isFinite(inicio) && Number.isFinite(fim) && fim >= inicio;
}

/**
 * Lista todos os períodos (data + slot) entre o início e o fim de uma operação,
 * andando slot a slot (a grade tem sempre 4 períodos/dia, virando o dia no slot 4→0).
 * Usada para gerar os apontamentos de uma operação de uma só vez.
 *
 * Rejeita intervalo invertido (fim antes do início, datas inválidas) em vez de
 * varrer até um limite arbitrário — sem essa checagem, um erro de digitação nas
 * datas/períodos gerava silenciosamente até ~1500 apontamentos numa operação só.
 */
export function enumerarPeriodos(
  dataInicial: Date,
  slotInicial: number,
  dataFinal: Date,
  slotFinal: number
): { data: Date; slot: number }[] {
  const inicio = ordinalPeriodo(dataInicial, slotInicial);
  const fim = ordinalPeriodo(dataFinal, slotFinal);
  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim < inicio) {
    throw new Error("Intervalo de datas/períodos inválido: o período final não pode ser anterior ao inicial.");
  }

  const periodos: { data: Date; slot: number }[] = [];
  let data = dataInicial;
  let slot = slotInicial;

  for (let ordinal = inicio; ordinal <= fim; ordinal++) {
    periodos.push({ data, slot });
    slot += 1;
    if (slot > 3) {
      slot = 0;
      data = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate() + 1));
    }
  }

  return periodos;
}

/** Trecho contínuo de trabalho dentro de uma operação (do 1º ao último período lançado). */
export type IntervaloOperacao = { dataInicial: Date; slotInicial: number; dataFinal: Date; slotFinal: number };

/**
 * Agrupa os períodos lançados de uma operação em trechos contínuos, período a
 * período (4 por dia). Um novo trecho começa sempre que faltar pelo menos um
 * período entre dois lançados — é o caso do navio que fica ao largo, atraca
 * (período não cobrado nesta operação) e volta ao largo: a cobrança mostra
 * "13/10 (1º) a 15/10 (2º) e 24/10 (3º) a 30/10 (4º)", pulando a vacância.
 * Mais de um vigia no mesmo período não quebra o trecho. A lista pode vir em qualquer ordem.
 */
export function agruparIntervalos(periodos: { data: Date; slot: number }[]): IntervaloOperacao[] {
  const ordenados = [...periodos].sort((a, b) => ordinalPeriodo(a.data, a.slot) - ordinalPeriodo(b.data, b.slot));
  const intervalos: IntervaloOperacao[] = [];

  for (const p of ordenados) {
    const atual = intervalos[intervalos.length - 1];
    const salto = atual ? ordinalPeriodo(p.data, p.slot) - ordinalPeriodo(atual.dataFinal, atual.slotFinal) : Infinity;
    if (atual && salto <= 1) {
      if (salto === 1) {
        atual.dataFinal = p.data;
        atual.slotFinal = p.slot;
      }
    } else {
      intervalos.push({ dataInicial: p.data, slotInicial: p.slot, dataFinal: p.data, slotFinal: p.slot });
    }
  }

  return intervalos;
}

/** Trecho sem cobrança, do (data, período) inicial ao final, inclusive. */
export type TrechoSemCobranca = { deData: Date; deSlot: number; ateData: Date; ateSlot: number };

/** true se o período (data + slot 0-3) cai dentro do trecho sem cobrança. */
export function periodoNoTrecho(data: Date, slot: number, t: TrechoSemCobranca): boolean {
  const o = ordinalPeriodo(data, slot);
  return o >= ordinalPeriodo(t.deData, t.deSlot) && o <= ordinalPeriodo(t.ateData, t.ateSlot);
}

/** Vãos (períodos sem lançamento) entre trechos consecutivos já apontados. */
export function vaosEntreIntervalos(intervalos: IntervaloOperacao[]): TrechoSemCobranca[] {
  const proximo = (data: Date, slot: number) =>
    slot < 3 ? { data, slot: slot + 1 } : { data: new Date(data.getTime() + 86400000), slot: 0 };
  const anterior = (data: Date, slot: number) =>
    slot > 0 ? { data, slot: slot - 1 } : { data: new Date(data.getTime() - 86400000), slot: 3 };
  return intervalos.slice(0, -1).map((t, i) => {
    const de = proximo(t.dataFinal, t.slotFinal);
    const ate = anterior(intervalos[i + 1].dataInicial, intervalos[i + 1].slotInicial);
    return { deData: de.data, deSlot: de.slot, ateData: ate.data, ateSlot: ate.slot };
  });
}

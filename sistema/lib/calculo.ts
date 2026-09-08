import { Local, Periodo, TipoDia } from "./tipos";

const DIAS_SEMANA: TipoDia[] = [
  "DOMINGO", // 0
  "UTIL", // 1 segunda
  "UTIL", // 2 terça
  "UTIL", // 3 quarta
  "UTIL", // 4 quinta
  "UTIL", // 5 sexta
  "SABADO", // 6
];

// Datas de apontamento/feriado são sempre dia-puro (ex: new Date("2026-08-26")), que o
// JS interpreta como meia-noite UTC — usar getters UTC evita que o fuso local do
// servidor (ex: America/Sao_Paulo, UTC-3) jogue a data um dia para trás.
function chaveData(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/** Classifica uma data em tipo de dia (útil/sábado/domingo/feriado). */
export function classificarData(data: Date, feriados: Date[]): TipoDia {
  const chave = chaveData(data);
  if (feriados.some((f) => chaveData(f) === chave)) return "FERIADO";
  return DIAS_SEMANA[data.getUTCDay()];
}

/** Classifica o tipo de dia de um apontamento pela própria data informada. */
export function classificarApontamento(data: Date, feriados: Date[]): TipoDia {
  return classificarData(data, feriados);
}

export type LinhaTarifa = {
  valorFinal: number;
  ferias: number;
  decimoTerceiro: number;
  fgts: number;
  inssPatronal: number;
};

export type TarifaMap = Map<string, LinhaTarifa>; // chave: `${local}|${tipoDia}|${periodo}`

export function chaveTarifa(local: Local, tipoDia: TipoDia, periodo: Periodo): string {
  return `${local}|${tipoDia}|${periodo}`;
}

/** Busca a linha de tarifa (valor do turno + os 4 encargos sociais) exatamente como cadastrada. */
export function buscarTarifaTurno(tarifas: TarifaMap, local: Local, tipoDia: TipoDia, periodo: Periodo): LinhaTarifa {
  const linha = tarifas.get(chaveTarifa(local, tipoDia, periodo));
  if (!linha) {
    throw new Error(`Tarifa não cadastrada para local=${local} tipoDia=${tipoDia} periodo=${periodo}`);
  }
  return {
    valorFinal: round2(linha.valorFinal),
    ferias: round2(linha.ferias),
    decimoTerceiro: round2(linha.decimoTerceiro),
    fgts: round2(linha.fgts),
    inssPatronal: round2(linha.inssPatronal),
  };
}

/**
 * Arredonda para 2 casas decimais (centavos). Usado em CADA etapa do cálculo
 * (não só na exibição final), para que a soma dos valores já arredondados
 * bata exatamente com o total cobrado — arredondar só no final faz o total
 * divergir em centavos da soma das partes já vistas pelo cliente.
 */
export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

// Percentuais oficiais (fonte: Tabela salario vigia.xlsx / Folha.xlsx / Relatórios_de_cobrança.xlsx)
export const PCT_RSR = 0.1818;
export const PCT_INSS = 0.11;
export const PCT_DAS = 0.0488;
export const PCT_DECIMO_TERCEIRO = 0.0909;
export const PCT_FERIAS = 0.1212;
export const PCT_FGTS = 0.097;
export const PCT_INSS_PATRONAL = 0.28713;
export const PCT_ENCARGOS_COBRANCA = 0.5962; // = 13º + Férias + FGTS + INSS Patronal
export const PCT_ADMINISTRACAO = 0.9;

export type ResultadoVigia = {
  vigiaId: number;
  matricula: number;
  nome: string;
  mmoBruta: number; // pré-RSR
  rsr: number;
  totalProventos: number;
  inss: number;
  irrf: number;
  das: number;
  pensao: number;
  credito: number;
  debito: number;
  liquido: number;
  decimoTerceiro: number;
  ferias: number;
  fgts: number;
  inssPatronal: number;
};

/**
 * Agrega os apontamentos (já com o valor final do turno resolvido) de UM vigia
 * dentro de uma operação e calcula todas as linhas da Folha de Pagamento.
 */
export function calcularResultadoVigia(params: {
  vigiaId: number;
  matricula: number;
  nome: string;
  valoresFinaisTurnos: number[]; // um valor por apontamento (já pós-RSR)
  // Encargos de cada apontamento, na mesma ordem de valoresFinaisTurnos, exatamente
  // como cadastrados na Tabela de Tarifas (pode trazer acertos pontuais de
  // arredondamento). Se omitido, cai no percentual padrão sobre o total (regra
  // padrão quando não há uma tabela de turnos para consultar, ex: nos testes).
  encargosTurnos?: LinhaTarifa[];
  pensao?: number;
  credito?: number;
  debito?: number;
}): ResultadoVigia {
  // Cada valor final de turno já vem arredondado (buscarTarifaTurno), então esta
  // soma já é uma soma de centavos exatos.
  const totalProventos = round2(params.valoresFinaisTurnos.reduce((a, b) => a + b, 0));
  const mmoBruta = round2(totalProventos / (1 + PCT_RSR));
  const rsr = round2(totalProventos - mmoBruta);

  const somarEncargo = (campo: "ferias" | "decimoTerceiro" | "fgts" | "inssPatronal", pctPadrao: number): number =>
    params.encargosTurnos
      ? round2(params.encargosTurnos.reduce((acc, linha) => acc + linha[campo], 0))
      : round2(totalProventos * pctPadrao);

  const ferias = somarEncargo("ferias", PCT_FERIAS);
  const decimoTerceiro = somarEncargo("decimoTerceiro", PCT_DECIMO_TERCEIRO);
  const fgts = somarEncargo("fgts", PCT_FGTS);
  const inssPatronal = somarEncargo("inssPatronal", PCT_INSS_PATRONAL);

  const inss = round2((totalProventos + ferias) * PCT_INSS);
  const irrf = 0;
  const das = round2(totalProventos * PCT_DAS);
  const pensao = round2(params.pensao ?? 0);
  const credito = round2(params.credito ?? 0);
  const debito = round2(params.debito ?? 0);
  const liquido = round2(totalProventos - inss - irrf - das - pensao + credito - debito);

  return {
    vigiaId: params.vigiaId,
    matricula: params.matricula,
    nome: params.nome,
    mmoBruta,
    rsr,
    totalProventos,
    inss,
    irrf,
    das,
    pensao,
    credito,
    debito,
    liquido,
    decimoTerceiro,
    ferias,
    fgts,
    inssPatronal,
  };
}

export type ResultadoFaturamento = {
  mmoVigias: number;
  encargos: number;
  subTotal: number;
  administracao: number;
  vt: number;
  vr: number;
  beneficios: number;
  total: number;
};

/**
 * Calcula o Relatório de Faturamento de uma operação a partir do total de
 * proventos de todos os vigias (mmoVigias) e da quantidade de turnos
 * trabalhados (para os benefícios VT/VR, cobrados por turno).
 */
export function calcularFaturamento(params: {
  mmoVigias: number;
  quantidadeTurnos: number;
  valorUnitVT: number;
  valorUnitVR: number;
}): ResultadoFaturamento {
  const { quantidadeTurnos } = params;
  const valorUnitVT = round2(params.valorUnitVT);
  const valorUnitVR = round2(params.valorUnitVR);
  // mmoVigias já é soma de totalProventos por vigia, cada um já arredondado em
  // calcularResultadoVigia — soma de centavos exatos.
  const mmoVigias = round2(params.mmoVigias);
  const encargos = round2(mmoVigias * PCT_ENCARGOS_COBRANCA);
  const subTotal = round2(mmoVigias + encargos);
  const administracao = round2(subTotal * PCT_ADMINISTRACAO);
  const vt = round2(quantidadeTurnos * valorUnitVT);
  const vr = round2(quantidadeTurnos * valorUnitVR);
  const beneficios = round2(vt + vr);
  const total = round2(subTotal + administracao + beneficios);

  return { mmoVigias, encargos, subTotal, administracao, vt, vr, beneficios, total };
}

/** Fatura de Serviços cobra apenas a Administração (receita do sindicato). */
export function calcularFaturaServicos(faturamento: ResultadoFaturamento): number {
  return faturamento.administracao;
}

/** Nota de Débito cobra o repasse real: Sub Total (MMO + Encargos) + Benefícios. */
export function calcularNotaDebito(faturamento: ResultadoFaturamento): number {
  return round2(faturamento.subTotal + faturamento.beneficios);
}

export type ResultadoNotaCredito = { valorDeduzido: number; valorLiquido: number };

/**
 * Modelo "All Flags": o desconto incide sobre a Taxa de Administração (Fatura
 * de Serviços) e é abatido do TOTAL GERAL da operação (Relatório de
 * Faturamento) — a agência continua pagando o repasse dos vigias (Nota de
 * Débito) integralmente, só a administração é reduzida.
 */
export function calcularNotaCreditoAllFlags(faturamento: ResultadoFaturamento, percentual: number): ResultadoNotaCredito {
  const valorDeduzido = round2(faturamento.administracao * (percentual / 100));
  const valorLiquido = round2(faturamento.total - valorDeduzido);
  return { valorDeduzido, valorLiquido };
}

/**
 * Modelo "North Star": o desconto incide direto sobre o valor de uma fatura
 * (Fatura de Serviços de vigia OU a fatura extra de lancha) — não envolve o
 * total geral da operação, só aquele documento específico.
 */
export function calcularNotaCreditoSobreValor(valor: number, percentual: number): ResultadoNotaCredito {
  const valorDeduzido = round2(valor * (percentual / 100));
  const valorLiquido = round2(valor - valorDeduzido);
  return { valorDeduzido, valorLiquido };
}

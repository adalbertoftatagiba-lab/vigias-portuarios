import { prisma } from "@/lib/prisma";
import {
  LinhaTarifa,
  ResultadoVigia,
  ResultadoFaturamento,
  PCT_RSR,
  buscarTarifaTurno,
  calcularFaturaServicos,
  calcularFaturamento,
  calcularNotaDebito,
  calcularResultadoVigia,
  classificarApontamento,
  round2,
} from "@/lib/calculo";
import { Local, Periodo, slotDoApontamento } from "@/lib/tipos";
import { obterVigenciaEm, paraMapa } from "@/lib/tarifas";

const DIAS_SEMANA_NOME = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export type LinhaDetalhe = {
  vigiaId: number;
  matricula: number;
  nome: string;
  data: Date;
  periodoInicial: number;
  periodoFinal: number;
  periodo: Periodo;
  local: Local;
  valorHora: number;
  mmoBruta: number;
  diaSemana: string;
  movimentacao: string;
};

export type DadosOperacao = {
  operacao: {
    id: number;
    numero: number;
    navio: string;
    porto: string;
    dataInicial: Date;
    dataFinal: Date;
    slotInicial: number;
    slotFinal: number;
    localPredominante: Local;
  };
  agencia: {
    cnpj: string;
    razaoSocial: string;
    endereco: string;
    cep: string;
    cidade: string;
    uf: string;
    telefone: string | null;
    email: string | null;
    percentualRepasse: number | null;
    modeloNC: string | null;
    dadosBancariosAlternativos: string | null;
  };
  detalhesApontamentos: LinhaDetalhe[];
  resultadosPorVigia: ResultadoVigia[];
  // Um resultado por apontamento (turno), alinhado 1:1 com detalhesApontamentos
  // (mesma ordem) — usado para gerar a Folha de Pagamento com uma página
  // individual por turno, mesmo quando o vigia trabalha 2 ou 3 turnos na
  // mesma operação (cada turno é um documento de folha separado).
  resultadosPorTurno: ResultadoVigia[];
  quantidadeTurnos: number;
  faturamento: ResultadoFaturamento;
  faturaServicos: number;
  notaDebito: number;
  // Fatura de Serviços extra de lancha (só quando a agência tem valorLancha
  // configurado) — número sequencial próprio, atribuído na 1ª geração.
  lancha: { numero: number; valor: number } | null;
};

export async function montarDadosOperacao(operacaoId: number): Promise<DadosOperacao> {
  const operacao = await prisma.operacao.findUniqueOrThrow({
    where: { id: operacaoId },
    include: { agencia: true },
  });

  const apontamentos = await prisma.apontamento.findMany({
    where: { operacaoId },
    include: { vigia: true },
    orderBy: { data: "asc" },
  });
  // A hora inicial sozinha não dá a ordem certa do dia (o 4º período, de
  // madrugada, tem hora menor que o 1º) — reordena pelo slot real (1º a 4º).
  apontamentos.sort((a, b) => {
    if (a.data.getTime() !== b.data.getTime()) return a.data.getTime() - b.data.getTime();
    return slotDoApontamento(operacao.porto, a.periodoInicial) - slotDoApontamento(operacao.porto, b.periodoInicial);
  });

  const feriados = await prisma.feriado.findMany();
  const feriadosDatas = feriados.map((f) => f.data);

  const ajustes = await prisma.ajusteFolha.findMany({ where: { operacaoId } });
  const ajustePorVigia = new Map(ajustes.map((a) => [a.vigiaId, a]));

  const valoresPorVigia = new Map<number, { matricula: number; nome: string; valores: number[]; encargos: LinhaTarifa[] }>();
  const contagemLocal = new Map<Local, number>();
  const detalhesApontamentos: LinhaDetalhe[] = [];
  // Turno a turno (mesma ordem de detalhesApontamentos), para montar
  // resultadosPorTurno depois do loop.
  const turnosParaResultado: { vigiaId: number; matricula: number; nome: string; valorFinal: number; encargo: LinhaTarifa }[] = [];

  for (const ap of apontamentos) {
    const tipoDia = classificarApontamento(ap.data, feriadosDatas);
    const vigencia = await obterVigenciaEm(ap.data);
    if (!vigencia) throw new Error("Nenhuma tabela de tarifas cadastrada.");
    const mapa = paraMapa(vigencia.valores);
    const local = ap.local as Local;
    const periodo = ap.periodo as Periodo;
    const tarifaTurno = buscarTarifaTurno(mapa, local, tipoDia, periodo);
    const valorFinal = tarifaTurno.valorFinal;
    const mmoBruta = round2(valorFinal / (1 + PCT_RSR));

    const entrada = valoresPorVigia.get(ap.vigiaId) ?? {
      matricula: ap.vigia.matricula,
      nome: ap.vigia.nome,
      valores: [],
      encargos: [],
    };
    entrada.valores.push(valorFinal);
    entrada.encargos.push(tarifaTurno);
    valoresPorVigia.set(ap.vigiaId, entrada);

    turnosParaResultado.push({
      vigiaId: ap.vigiaId,
      matricula: ap.vigia.matricula,
      nome: ap.vigia.nome,
      valorFinal,
      encargo: tarifaTurno,
    });

    contagemLocal.set(local, (contagemLocal.get(local) ?? 0) + 1);

    detalhesApontamentos.push({
      vigiaId: ap.vigiaId,
      matricula: ap.vigia.matricula,
      nome: ap.vigia.nome,
      data: ap.data,
      periodoInicial: ap.periodoInicial,
      periodoFinal: ap.periodoFinal,
      periodo,
      local,
      valorHora: round2(mmoBruta / 6),
      mmoBruta,
      // Em dia de feriado, a coluna "Tipo de Dia" mostra "Feriado" (é o que
      // pautou o cálculo do turno) em vez do nome do dia da semana.
      diaSemana: tipoDia === "FERIADO" ? "Feriado" : DIAS_SEMANA_NOME[ap.data.getUTCDay()],
      movimentacao: ap.movimentacao ?? "",
    });
  }

  const resultadosPorVigia: ResultadoVigia[] = [...valoresPorVigia.entries()].map(([vigiaId, v]) => {
    const ajuste = ajustePorVigia.get(vigiaId);
    return calcularResultadoVigia({
      vigiaId,
      matricula: v.matricula,
      nome: v.nome,
      valoresFinaisTurnos: v.valores,
      encargosTurnos: v.encargos,
      pensao: ajuste?.pensao,
      credito: ajuste?.credito,
      debito: ajuste?.debito,
    });
  });
  resultadosPorVigia.sort((a, b) => a.matricula - b.matricula);

  // Índice (na ordem cronológica real da operação) do último turno de cada
  // vigia — o ajuste manual (pensão/crédito/débito), lançado uma única vez
  // por vigia por operação, entra só na folha desse turno, para não duplicar
  // o desconto/crédito em cada folha individual do mesmo vigia.
  const ultimoIndicePorVigia = new Map<number, number>();
  turnosParaResultado.forEach((t, i) => ultimoIndicePorVigia.set(t.vigiaId, i));

  const resultadosPorTurno: ResultadoVigia[] = turnosParaResultado.map((t, i) => {
    const ajuste = ultimoIndicePorVigia.get(t.vigiaId) === i ? ajustePorVigia.get(t.vigiaId) : undefined;
    return calcularResultadoVigia({
      vigiaId: t.vigiaId,
      matricula: t.matricula,
      nome: t.nome,
      valoresFinaisTurnos: [t.valorFinal],
      encargosTurnos: [t.encargo],
      pensao: ajuste?.pensao,
      credito: ajuste?.credito,
      debito: ajuste?.debito,
    });
  });

  const mmoVigias = resultadosPorVigia.reduce((acc, r) => acc + r.totalProventos, 0);
  const quantidadeTurnos = apontamentos.length;

  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const faturamento = calcularFaturamento({
    mmoVigias,
    quantidadeTurnos,
    valorUnitVT: config?.valorVT ?? 0,
    valorUnitVR: config?.valorVR ?? 0,
  });

  let localPredominante: Local = "AO_LARGO";
  let max = -1;
  for (const [local, qtd] of contagemLocal) {
    if (qtd > max) {
      max = qtd;
      localPredominante = local;
    }
  }

  let lancha: DadosOperacao["lancha"] = null;
  if (operacao.agencia.valorLancha) {
    const numero =
      operacao.numeroLancha ??
      (await prisma.$transaction(async (tx) => {
        const config = await tx.configuracao.upsert({
          where: { id: 1 },
          create: { id: 1, proximoNumero: 2, valorVT: 0, valorVR: 0 },
          update: { proximoNumero: { increment: 1 } },
        });
        const proximo = config.proximoNumero - 1;
        await tx.operacao.update({ where: { id: operacaoId }, data: { numeroLancha: proximo } });
        return proximo;
      }));
    lancha = { numero, valor: round2(quantidadeTurnos * operacao.agencia.valorLancha) };
  }

  return {
    operacao: {
      id: operacao.id,
      numero: operacao.numero,
      navio: operacao.navio,
      porto: operacao.porto,
      dataInicial: operacao.dataInicial,
      dataFinal: operacao.dataFinal,
      slotInicial: operacao.slotInicial,
      slotFinal: operacao.slotFinal,
      localPredominante,
    },
    agencia: operacao.agencia,
    detalhesApontamentos,
    resultadosPorVigia,
    resultadosPorTurno,
    quantidadeTurnos,
    faturamento,
    faturaServicos: calcularFaturaServicos(faturamento),
    notaDebito: calcularNotaDebito(faturamento),
    lancha,
  };
}

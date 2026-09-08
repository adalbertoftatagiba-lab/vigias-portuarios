import { prisma } from "@/lib/prisma";
import { enumerarPeriodos, gradeDoPorto } from "@/lib/tipos";

export function escolherVigiaAleatorio(vigiaIds: number[]): number | null {
  if (vigiaIds.length === 0) return null;
  return vigiaIds[Math.floor(Math.random() * vigiaIds.length)];
}

type OperacaoParaGeracao = {
  id: number;
  porto: string;
  dataInicial: Date;
  slotInicial: number;
  dataFinal: Date;
  slotFinal: number;
  local: string;
};

/**
 * Gera todos os apontamentos de uma operação em modo ALEATORIO, do
 * (dataInicial, slotInicial) ao (dataFinal, slotFinal), sorteando um vigia por
 * período. Pula períodos que já têm apontamento lançado (idempotente, então
 * pode ser chamada de novo com segurança).
 */
export async function gerarApontamentosAutomaticamente(operacao: OperacaoParaGeracao) {
  const [vigias, existentes] = await Promise.all([
    prisma.vigia.findMany({ select: { id: true } }),
    prisma.apontamento.findMany({
      where: { operacaoId: operacao.id },
      select: { data: true, periodoInicial: true },
    }),
  ]);
  const vigiaIds = vigias.map((v) => v.id);
  if (vigiaIds.length === 0) return;

  const jaLancados = new Set(existentes.map((a) => `${a.data.getTime()}|${a.periodoInicial}`));
  const grade = gradeDoPorto(operacao.porto);
  const periodos = enumerarPeriodos(operacao.dataInicial, operacao.slotInicial, operacao.dataFinal, operacao.slotFinal);

  const novos = periodos
    .map(({ data, slot }) => ({ data, janela: grade[slot] }))
    .filter(({ data, janela }) => janela && !jaLancados.has(`${data.getTime()}|${janela.inicial}`))
    .map(({ data, janela }) => ({
      operacaoId: operacao.id,
      vigiaId: escolherVigiaAleatorio(vigiaIds)!,
      data,
      periodoInicial: janela.inicial,
      periodoFinal: janela.final,
      periodo: janela.periodo,
      local: operacao.local,
    }));

  if (novos.length > 0) {
    await prisma.apontamento.createMany({ data: novos });
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { escolherVigiaAleatorio, gerarApontamentosAutomaticamente } from "@/lib/apontamentos";
import { agruparIntervalos, gradeDoPorto, intervaloEmOrdem, periodoNoTrecho, slotDoApontamento, vaosEntreIntervalos } from "@/lib/tipos";

export async function criarApontamento(formData: FormData) {
  const operacaoId = Number(formData.get("operacaoId"));
  const data = String(formData.get("data") ?? "");
  const slot = Number(formData.get("slot"));
  const movimentacao = String(formData.get("movimentacao") ?? "").trim() || null;

  if (!operacaoId || !data || Number.isNaN(slot)) return;

  const operacao = await prisma.operacao.findUnique({ where: { id: operacaoId } });
  if (!operacao) return;

  const vigiaId =
    operacao.modoVigia === "ALEATORIO"
      ? escolherVigiaAleatorio((await prisma.vigia.findMany({ select: { id: true } })).map((v) => v.id))
      : Number(formData.get("vigiaId")) || null;
  if (!vigiaId) return;

  const grade = gradeDoPorto(operacao.porto);
  const janela = grade[slot];
  if (!janela) return;

  await prisma.apontamento.create({
    data: {
      operacaoId,
      vigiaId,
      data: new Date(data),
      periodoInicial: janela.inicial,
      periodoFinal: janela.final,
      periodo: janela.periodo,
      local: operacao.local,
      movimentacao,
    },
  });

  revalidatePath(`/operacoes/${operacaoId}/apontamentos`);
}

/**
 * Completa os períodos da operação que ainda não têm apontamento lançado
 * (ex: quando a operação foi criada antes de cadastrar os vigias). A geração
 * do período inteiro já acontece sozinha ao criar a operação em modo
 * ALEATORIO — este botão é só um reforço, por isso é seguro clicar de novo.
 */
export async function gerarApontamentosAutomaticos(formData: FormData) {
  const operacaoId = Number(formData.get("operacaoId"));
  if (!operacaoId) return;

  const operacao = await prisma.operacao.findUnique({ where: { id: operacaoId } });
  if (!operacao || operacao.modoVigia !== "ALEATORIO") return;

  // Se a operação já tem dias sem cobrança no meio (trechos separados), o
  // "completar" não pode preencher esse vão — só completa dentro dos trechos.
  const existentes = await prisma.apontamento.findMany({
    where: { operacaoId },
    select: { data: true, periodoInicial: true },
  });
  const trechos = agruparIntervalos(existentes.map((a) => ({ data: a.data, slot: slotDoApontamento(operacao.porto, a.periodoInicial) })));

  // Operações com data/período final antes do inicial (só possíveis se criadas
  // antes da validação de intervalo existir) não devem derrubar a página.
  try {
    await gerarApontamentosAutomaticamente(operacao, vaosEntreIntervalos(trechos));
  } catch {
    return;
  }

  revalidatePath(`/operacoes/${operacaoId}/apontamentos`);
}

export async function excluirApontamento(formData: FormData) {
  const id = Number(formData.get("id"));
  const operacaoId = Number(formData.get("operacaoId"));
  if (!id) return;
  await prisma.apontamento.delete({ where: { id } });
  revalidatePath(`/operacoes/${operacaoId}/apontamentos`);
}

export async function salvarAjuste(formData: FormData) {
  const operacaoId = Number(formData.get("operacaoId"));
  const vigiaId = Number(formData.get("vigiaId"));
  const pensao = Number(formData.get("pensao")) || 0;
  const credito = Number(formData.get("credito")) || 0;
  const debito = Number(formData.get("debito")) || 0;
  if (!operacaoId || !vigiaId) return;

  await prisma.ajusteFolha.upsert({
    where: { operacaoId_vigiaId: { operacaoId, vigiaId } },
    create: { operacaoId, vigiaId, pensao, credito, debito },
    update: { pensao, credito, debito },
  });

  revalidatePath(`/operacoes/${operacaoId}/apontamentos`);
}

/**
 * Exclui de uma vez todos os apontamentos da operação entre dois pontos
 * (data + período), inclusive — usado quando a operação foi lançada de forma
 * contínua mas um trecho no meio não deve ser cobrado (ex: navio atracado do
 * 3º período de 15/10 ao 2º período de 24/10). Os relatórios passam a mostrar
 * os trechos separados.
 */
export async function excluirApontamentosIntervalo(formData: FormData) {
  const operacaoId = Number(formData.get("operacaoId"));
  const de = String(formData.get("de") ?? "");
  const ate = String(formData.get("ate") ?? "") || de;
  const deSlot = Number(formData.get("deSlot") ?? 0);
  const ateSlot = Number(formData.get("ateSlot") ?? 3);
  if (!operacaoId || !de) return;

  const trecho = { deData: new Date(de), deSlot, ateData: new Date(ate), ateSlot };
  if (!intervaloEmOrdem(trecho.deData, deSlot, trecho.ateData, ateSlot)) return;

  const operacao = await prisma.operacao.findUnique({ where: { id: operacaoId } });
  if (!operacao) return;

  const candidatos = await prisma.apontamento.findMany({
    where: { operacaoId, data: { gte: trecho.deData, lte: trecho.ateData } },
    select: { id: true, data: true, periodoInicial: true },
  });
  const ids = candidatos
    .filter((a) => periodoNoTrecho(a.data, slotDoApontamento(operacao.porto, a.periodoInicial), trecho))
    .map((a) => a.id);

  if (ids.length > 0) {
    await prisma.apontamento.deleteMany({ where: { id: { in: ids } } });
  }

  revalidatePath(`/operacoes/${operacaoId}/apontamentos`);
  revalidatePath(`/operacoes/${operacaoId}/relatorios`);
}

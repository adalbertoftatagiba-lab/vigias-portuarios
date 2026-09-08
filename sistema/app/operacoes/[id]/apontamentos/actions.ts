"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { escolherVigiaAleatorio, gerarApontamentosAutomaticamente } from "@/lib/apontamentos";
import { gradeDoPorto } from "@/lib/tipos";

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

  await gerarApontamentosAutomaticamente(operacao);

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

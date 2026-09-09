"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gerarApontamentosAutomaticamente } from "@/lib/apontamentos";

export async function criarOperacao(formData: FormData) {
  const navio = String(formData.get("navio") ?? "").trim();
  const porto = String(formData.get("porto") ?? "").trim();
  const agenciaId = Number(formData.get("agenciaId"));
  const dataInicial = String(formData.get("dataInicial") ?? "");
  const dataFinal = String(formData.get("dataFinal") ?? "");
  const modoVigia = formData.get("modoVigia") === "ALEATORIO" ? "ALEATORIO" : "MANUAL";
  const slotInicial = Number(formData.get("slotInicial"));
  const slotFinal = Number(formData.get("slotFinal"));
  const local = formData.get("local") === "AO_LARGO" ? "AO_LARGO" : "ATRACADO";

  if (!navio || !porto || !agenciaId || !dataInicial || !dataFinal) return;
  if (Number.isNaN(slotInicial) || Number.isNaN(slotFinal)) return;

  const operacao = await prisma.$transaction(async (tx) => {
    const config = await tx.configuracao.upsert({
      where: { id: 1 },
      create: { id: 1, proximoNumero: 2, valorVT: 0, valorVR: 0 },
      update: { proximoNumero: { increment: 1 } },
    });
    const numero = config.proximoNumero - 1;

    return tx.operacao.create({
      data: {
        numero,
        navio,
        porto,
        agenciaId,
        dataInicial: new Date(dataInicial),
        dataFinal: new Date(dataFinal),
        slotInicial,
        slotFinal,
        local,
        modoVigia,
      },
    });
  });

  if (operacao.modoVigia === "ALEATORIO") {
    await gerarApontamentosAutomaticamente(operacao);
  }

  revalidatePath("/operacoes");
  redirect(`/operacoes/${operacao.id}/apontamentos`);
}

/**
 * Corrige os dados cadastrais de uma operação já criada (ex: nome do navio
 * digitado errado). Não mexe nos apontamentos já lançados — se a data/período
 * mudar, eles continuam como estão, precisam ser ajustados à parte se for o caso.
 */
export async function atualizarOperacao(formData: FormData) {
  const id = Number(formData.get("id"));
  const navio = String(formData.get("navio") ?? "").trim();
  const porto = String(formData.get("porto") ?? "").trim();
  const agenciaId = Number(formData.get("agenciaId"));
  const dataInicial = String(formData.get("dataInicial") ?? "");
  const dataFinal = String(formData.get("dataFinal") ?? "");
  const modoVigia = formData.get("modoVigia") === "ALEATORIO" ? "ALEATORIO" : "MANUAL";
  const slotInicial = Number(formData.get("slotInicial"));
  const slotFinal = Number(formData.get("slotFinal"));
  const local = formData.get("local") === "AO_LARGO" ? "AO_LARGO" : "ATRACADO";

  if (!id || !navio || !porto || !agenciaId || !dataInicial || !dataFinal) return;
  if (Number.isNaN(slotInicial) || Number.isNaN(slotFinal)) return;

  await prisma.operacao.update({
    where: { id },
    data: {
      navio,
      porto,
      agenciaId,
      dataInicial: new Date(dataInicial),
      dataFinal: new Date(dataFinal),
      slotInicial,
      slotFinal,
      local,
      modoVigia,
    },
  });

  revalidatePath("/operacoes");
  revalidatePath(`/operacoes/${id}/apontamentos`);
  revalidatePath(`/operacoes/${id}/relatorios`);
}

export async function excluirOperacao(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.operacao.delete({ where: { id } });
  revalidatePath("/operacoes");
}

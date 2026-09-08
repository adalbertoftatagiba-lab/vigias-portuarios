"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function criarFeriado(formData: FormData) {
  const data = String(formData.get("data") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!data || !descricao) return;
  await prisma.feriado.create({ data: { data: new Date(data), descricao } });
  revalidatePath("/feriados");
}

export async function excluirFeriado(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.feriado.delete({ where: { id } });
  revalidatePath("/feriados");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function criarVigia(formData: FormData) {
  const matricula = Number(formData.get("matricula"));
  const nome = String(formData.get("nome") ?? "").trim();
  if (!matricula || !nome) return;
  await prisma.vigia.create({ data: { matricula, nome } });
  revalidatePath("/vigias");
}

export async function atualizarVigia(formData: FormData) {
  const id = Number(formData.get("id"));
  const matricula = Number(formData.get("matricula"));
  const nome = String(formData.get("nome") ?? "").trim();
  if (!id || !matricula || !nome) return;
  await prisma.vigia.update({ where: { id }, data: { matricula, nome } });
  revalidatePath("/vigias");
}

export async function excluirVigia(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.vigia.delete({ where: { id } });
  revalidatePath("/vigias");
}

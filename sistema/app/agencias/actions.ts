"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function numeroOuNulo(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const n = Number(texto);
  return Number.isNaN(n) ? null : n;
}

function campos(formData: FormData) {
  const percentualRepasse = numeroOuNulo(formData.get("percentualRepasse"));
  return {
    cnpj: String(formData.get("cnpj") ?? "").trim(),
    razaoSocial: String(formData.get("razaoSocial") ?? "").trim(),
    endereco: String(formData.get("endereco") ?? "").trim(),
    cep: String(formData.get("cep") ?? "").trim(),
    cidade: String(formData.get("cidade") ?? "").trim(),
    uf: String(formData.get("uf") ?? "").trim(),
    telefone: String(formData.get("telefone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    percentualRepasse,
    // Só grava o modelo quando há percentual de repasse — sem repasse, o campo
    // não faz sentido mesmo que tenha sobrado algo preenchido no formulário.
    modeloNC: percentualRepasse ? String(formData.get("modeloNC") ?? "").trim() || null : null,
    valorLancha: numeroOuNulo(formData.get("valorLancha")),
  };
}

export async function criarAgencia(formData: FormData) {
  const data = campos(formData);
  if (!data.cnpj || !data.razaoSocial) return;
  await prisma.agencia.create({ data });
  revalidatePath("/agencias");
}

export async function atualizarAgencia(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.agencia.update({ where: { id }, data: campos(formData) });
  revalidatePath("/agencias");
}

export async function excluirAgencia(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.agencia.delete({ where: { id } });
  revalidatePath("/agencias");
}

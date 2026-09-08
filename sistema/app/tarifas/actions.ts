"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/calculo";
import { COMBOS_TARIFA } from "./combos";

export async function salvarNovaVigencia(formData: FormData) {
  const vigenteDesde = String(formData.get("vigenteDesde") ?? "");
  if (!vigenteDesde) return;

  const valores = COMBOS_TARIFA.map(({ local, tipoDia, periodo, campo }) => ({
    local,
    tipoDia,
    periodo,
    valorFinal: round2(Number(formData.get(campo))),
    ferias: round2(Number(formData.get(`${campo}__ferias`))),
    decimoTerceiro: round2(Number(formData.get(`${campo}__decimoTerceiro`))),
    fgts: round2(Number(formData.get(`${campo}__fgts`))),
    inssPatronal: round2(Number(formData.get(`${campo}__inssPatronal`))),
  }));

  if (
    valores.some(
      (v) =>
        Number.isNaN(v.valorFinal) ||
        Number.isNaN(v.ferias) ||
        Number.isNaN(v.decimoTerceiro) ||
        Number.isNaN(v.fgts) ||
        Number.isNaN(v.inssPatronal)
    )
  )
    return;

  await prisma.tarifaVigencia.create({
    data: {
      vigenteDesde: new Date(vigenteDesde),
      valores: { create: valores },
    },
  });

  const valorVT = round2(Number(formData.get("valorVT")));
  const valorVR = round2(Number(formData.get("valorVR")));
  await prisma.configuracao.upsert({
    where: { id: 1 },
    create: { id: 1, proximoNumero: 1, valorVT, valorVR },
    update: { valorVT, valorVR },
  });

  revalidatePath("/tarifas");
}

export async function excluirVigencia(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.tarifaVigencia.delete({ where: { id } });
  revalidatePath("/tarifas");
}

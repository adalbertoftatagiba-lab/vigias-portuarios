"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function salvarProximoNumero(formData: FormData) {
  const proximoNumero = Number(formData.get("proximoNumero"));
  if (!proximoNumero || proximoNumero < 1) return;

  await prisma.configuracao.upsert({
    where: { id: 1 },
    create: { id: 1, proximoNumero, valorVT: 0, valorVR: 0 },
    update: { proximoNumero },
  });

  revalidatePath("/configuracoes");
}

import { prisma } from "@/lib/prisma";
import { TarifaMap, chaveTarifa } from "@/lib/calculo";
import { Local, Periodo, TipoDia } from "@/lib/tipos";

/** Retorna a vigência de tarifa aplicável a uma data (a mais recente com vigenteDesde <= data). */
export async function obterVigenciaEm(data: Date) {
  const vigencia = await prisma.tarifaVigencia.findFirst({
    where: { vigenteDesde: { lte: data } },
    orderBy: { vigenteDesde: "desc" },
    include: { valores: true },
  });
  if (vigencia) return vigencia;

  // Sem vigência anterior à data (ex: apontamento retroativo antes da 1ª tarifa cadastrada):
  // usa a vigência mais antiga disponível.
  return prisma.tarifaVigencia.findFirst({
    orderBy: { vigenteDesde: "asc" },
    include: { valores: true },
  });
}

export function paraMapa(
  valores: {
    local: string;
    tipoDia: string;
    periodo: string;
    valorFinal: number;
    ferias: number;
    decimoTerceiro: number;
    fgts: number;
    inssPatronal: number;
  }[]
): TarifaMap {
  const mapa: TarifaMap = new Map();
  for (const v of valores) {
    mapa.set(chaveTarifa(v.local as Local, v.tipoDia as TipoDia, v.periodo as Periodo), {
      valorFinal: v.valorFinal,
      ferias: v.ferias,
      decimoTerceiro: v.decimoTerceiro,
      fgts: v.fgts,
      inssPatronal: v.inssPatronal,
    });
  }
  return mapa;
}

export async function obterTarifaVigenteMaisRecente() {
  return prisma.tarifaVigencia.findFirst({
    orderBy: { vigenteDesde: "desc" },
    include: { valores: true },
  });
}

import { Local, Periodo, TipoDia } from "@/lib/tipos";

export type ComboTarifa = { local: Local; tipoDia: TipoDia; periodo: Periodo; campo: string; label: string };

function combo(local: Local, tipoDia: TipoDia, periodo: Periodo): ComboTarifa {
  return {
    local,
    tipoDia,
    periodo,
    campo: `${local}_${tipoDia}_${periodo}`,
    label: periodo === "DIA" ? "Dia" : "Noite",
  };
}

export const TIPOS_DIA_ORDEM: TipoDia[] = ["UTIL", "SABADO", "DOMINGO", "FERIADO"];
export const TIPOS_DIA_LABEL: Record<TipoDia, string> = {
  UTIL: "De 2ª à 6ª",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
  FERIADO: "Feriado",
};

export const COMBOS_TARIFA: ComboTarifa[] = (["ATRACADO", "AO_LARGO"] as Local[]).flatMap((local) =>
  TIPOS_DIA_ORDEM.flatMap((tipoDia) => [combo(local, tipoDia, "DIA"), combo(local, tipoDia, "NOITE")])
);

"use client";

import { useState } from "react";
import { PCT_DECIMO_TERCEIRO, PCT_FERIAS, PCT_FGTS, PCT_INSS_PATRONAL, round2 } from "@/lib/calculo";

type ChaveEncargo = "ferias" | "decimoTerceiro" | "fgts" | "inssPatronal";

const ENCARGOS: { chave: ChaveEncargo; label: string; pct: number }[] = [
  { chave: "ferias", label: "Férias", pct: PCT_FERIAS },
  { chave: "decimoTerceiro", label: "13º Salário", pct: PCT_DECIMO_TERCEIRO },
  { chave: "fgts", label: "FGTS", pct: PCT_FGTS },
  { chave: "inssPatronal", label: "INSS Patronal", pct: PCT_INSS_PATRONAL },
];

/**
 * Campo de valor bruto do turno + os 4 encargos (Férias, 13º, FGTS, INSS
 * Patronal). Os encargos vêm preenchidos como percentual do bruto, mas são
 * editáveis: a Tabela Salário Vigia oficial às vezes traz um acerto pontual de
 * arredondamento célula a célula, que não é a regra padrão mas precisa poder
 * ser digitado aqui. Editar o valor bruto recalcula os encargos que ainda não
 * foram tocados manualmente nesta sessão de edição.
 */
export function CelulaTarifa({
  campo,
  valorInicial,
  encargosIniciais,
}: {
  campo: string;
  valorInicial: number | "";
  encargosIniciais?: Partial<Record<ChaveEncargo, number>>;
}) {
  const brutoInicial = typeof valorInicial === "number" ? valorInicial : 0;
  const [valorStr, setValorStr] = useState(valorInicial === "" ? "" : String(valorInicial));
  const [encargosStr, setEncargosStr] = useState<Record<ChaveEncargo, string>>(() => {
    const base = {} as Record<ChaveEncargo, string>;
    for (const e of ENCARGOS) {
      const salvo = encargosIniciais?.[e.chave];
      base[e.chave] = String(salvo ?? round2(brutoInicial * e.pct));
    }
    return base;
  });
  const [tocados, setTocados] = useState<Set<ChaveEncargo>>(new Set());

  function alterarValor(str: string) {
    setValorStr(str);
    const num = Number(str) || 0;
    setEncargosStr((atual) => {
      const proximo = { ...atual };
      for (const e of ENCARGOS) {
        if (!tocados.has(e.chave)) proximo[e.chave] = String(round2(num * e.pct));
      }
      return proximo;
    });
  }

  function alterarEncargo(chave: ChaveEncargo, str: string) {
    setTocados((atual) => new Set(atual).add(chave));
    setEncargosStr((atual) => ({ ...atual, [chave]: str }));
  }

  return (
    <div className="space-y-1">
      <input
        name={campo}
        type="number"
        step="0.01"
        required
        value={valorStr}
        onChange={(e) => alterarValor(e.target.value)}
        className="w-24 rounded border border-slate-300 px-1 py-0.5"
      />
      <div className="space-y-0.5">
        {ENCARGOS.map((e) => (
          <div key={e.chave} className="flex items-center gap-1">
            <span className="w-16 shrink-0 text-[9px] text-slate-500">{e.label}</span>
            <input
              name={`${campo}__${e.chave}`}
              type="number"
              step="0.01"
              required
              value={encargosStr[e.chave]}
              onChange={(ev) => alterarEncargo(e.chave, ev.target.value)}
              className="w-16 rounded border border-slate-200 px-1 py-0.5 text-[9px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

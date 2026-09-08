import { prisma } from "@/lib/prisma";
import { LOCAL_LABEL, Local } from "@/lib/tipos";
import { round2 } from "@/lib/calculo";
import { COMBOS_TARIFA, TIPOS_DIA_LABEL, TIPOS_DIA_ORDEM } from "./combos";
import { salvarNovaVigencia, excluirVigencia } from "./actions";
import { CelulaTarifa } from "./CelulaTarifa";

export const dynamic = "force-dynamic";

export default async function TarifasPage() {
  const vigencias = await prisma.tarifaVigencia.findMany({
    orderBy: { vigenteDesde: "desc" },
    include: { valores: true },
  });
  const atual = vigencias[0];
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });

  const mapaAtual = new Map<string, number>();
  const mapaEncargos = new Map<string, { ferias: number; decimoTerceiro: number; fgts: number; inssPatronal: number }>();
  for (const v of atual?.valores ?? []) {
    const campo = `${v.local}_${v.tipoDia}_${v.periodo}`;
    mapaAtual.set(campo, round2(v.valorFinal));
    mapaEncargos.set(campo, {
      ferias: round2(v.ferias),
      decimoTerceiro: round2(v.decimoTerceiro),
      fgts: round2(v.fgts),
      inssPatronal: round2(v.inssPatronal),
    });
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Tarifas do Sindicato</h1>
        <p className="text-sm text-slate-600">
          Valor final do turno de 6h (já com R.S.R. embutido), por local, tipo de dia e período — abaixo de
          cada valor, a prévia de Férias, 13º Salário, FGTS e INSS Patronal calculados sobre ele, conforme a
          Tabela Salário Vigia. Salvar cria uma nova vigência a partir da data escolhida — apontamentos
          anteriores continuam usando a tarifa que estava em vigor na época.
        </p>
      </div>

      <form action={salvarNovaVigencia} className="space-y-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-slate-600">Vigente a partir de</label>
            <input
              name="vigenteDesde"
              type="date"
              required
              defaultValue={hoje}
              className="rounded border border-slate-300 px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Vale Transporte (R$/turno)</label>
            <input
              name="valorVT"
              type="number"
              step="0.01"
              required
              defaultValue={round2(config?.valorVT ?? 0)}
              className="w-32 rounded border border-slate-300 px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">Vale Refeição (R$/turno)</label>
            <input
              name="valorVR"
              type="number"
              step="0.01"
              required
              defaultValue={round2(config?.valorVR ?? 0)}
              className="w-32 rounded border border-slate-300 px-2 py-1"
            />
          </div>
        </div>

        {(["ATRACADO", "AO_LARGO"] as Local[]).map((local) => (
          <div key={local}>
            <h2 className="font-medium mb-2">{LOCAL_LABEL[local]}</h2>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Período</th>
                    {TIPOS_DIA_ORDEM.map((td) => (
                      <th key={td} className="px-3 py-2 text-left">{TIPOS_DIA_LABEL[td]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["DIA", "NOITE"] as const).map((periodo) => (
                    <tr key={periodo} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 font-medium">{periodo === "DIA" ? "Dia" : "Noite"}</td>
                      {TIPOS_DIA_ORDEM.map((tipoDia) => {
                        const combo = COMBOS_TARIFA.find(
                          (c) => c.local === local && c.tipoDia === tipoDia && c.periodo === periodo
                        )!;
                        return (
                          <td key={combo.campo} className="px-3 py-1.5 align-top">
                            <CelulaTarifa
                              campo={combo.campo}
                              valorInicial={mapaAtual.get(combo.campo) ?? ""}
                              encargosIniciais={mapaEncargos.get(combo.campo)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          Salvar nova vigência
        </button>
      </form>

      <div>
        <h2 className="font-medium mb-2">Histórico de vigências</h2>
        <ul className="space-y-1 text-sm">
          {vigencias.map((v) => (
            <li key={v.id} className="flex items-center gap-3">
              <span>
                Vigente desde {v.vigenteDesde.toISOString().slice(0, 10).split("-").reverse().join("/")}
              </span>
              {vigencias.length > 1 && (
                <form action={excluirVigencia}>
                  <input type="hidden" name="id" value={v.id} />
                  <button type="submit" className="text-red-700 hover:underline">
                    Excluir
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

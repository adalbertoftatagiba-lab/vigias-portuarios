import { prisma } from "@/lib/prisma";
import { criarFeriado, excluirFeriado } from "./actions";

export const dynamic = "force-dynamic";

export default async function FeriadosPage() {
  const feriados = await prisma.feriado.findMany({ orderBy: { data: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Feriados</h1>
        <p className="text-sm text-slate-600">
          Usados para classificar automaticamente o tipo de dia dos apontamentos.
        </p>
      </div>

      <form action={criarFeriado} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs text-slate-600">Data</label>
          <input name="data" type="date" required className="rounded border border-slate-300 px-2 py-1" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-600">Descrição</label>
          <input name="descricao" type="text" required className="w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          Adicionar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2 w-32">Data</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {feriados.map((f) => (
              <tr key={f.id} className="border-t border-slate-100">
                <td className="px-3 py-1.5">
                  {f.data.toISOString().slice(0, 10).split("-").reverse().join("/")}
                </td>
                <td className="px-3 py-1.5">{f.descricao}</td>
                <td className="px-3 py-1.5">
                  <form action={excluirFeriado}>
                    <input type="hidden" name="id" value={f.id} />
                    <button type="submit" className="text-red-700 hover:underline">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { criarVigia, atualizarVigia, excluirVigia } from "./actions";

export const dynamic = "force-dynamic";

export default async function VigiasPage() {
  const vigias = await prisma.vigia.findMany({ orderBy: { matricula: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Vigias</h1>
        <p className="text-sm text-slate-600">{vigias.length} vigias cadastrados</p>
      </div>

      <form action={criarVigia} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs text-slate-600">Matrícula</label>
          <input name="matricula" type="number" required className="w-28 rounded border border-slate-300 px-2 py-1" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-600">Nome</label>
          <input name="nome" type="text" required className="w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          Adicionar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2 w-24">Matrícula</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {vigias.map((v) => (
              <tr key={v.id} className="border-t border-slate-100">
                <td className="px-3 py-1.5 align-top">
                  <form action={atualizarVigia} id={`form-${v.id}`}>
                    <input type="hidden" name="id" value={v.id} />
                    <input
                      name="matricula"
                      type="number"
                      defaultValue={v.matricula}
                      form={`form-${v.id}`}
                      className="w-20 rounded border border-slate-300 px-1 py-0.5"
                    />
                  </form>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    name="nome"
                    type="text"
                    defaultValue={v.nome}
                    form={`form-${v.id}`}
                    className="w-full rounded border border-slate-300 px-1 py-0.5"
                  />
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <button form={`form-${v.id}`} type="submit" className="text-blue-700 hover:underline mr-3">
                    Salvar
                  </button>
                  <form action={excluirVigia} className="inline">
                    <input type="hidden" name="id" value={v.id} />
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

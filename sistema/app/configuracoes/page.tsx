import { prisma } from "@/lib/prisma";
import { salvarProximoNumero } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  const ultimaOperacao = await prisma.operacao.findFirst({ orderBy: { numero: "desc" } });

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-slate-600">
          Número sequencial ("Nº") usado nos relatórios de cobrança. Cada nova operação criada
          consome o próximo número e o incrementa em 1.
        </p>
      </div>

      <form action={salvarProximoNumero} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs text-slate-600">Próximo número a ser usado</label>
          <input
            name="proximoNumero"
            type="number"
            min={1}
            required
            defaultValue={config?.proximoNumero ?? 1}
            className="w-40 rounded border border-slate-300 px-2 py-1"
          />
        </div>
        {ultimaOperacao && (
          <p className="text-xs text-slate-500">
            Última operação criada usou o número {ultimaOperacao.numero}.
          </p>
        )}
        <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          Salvar
        </button>
      </form>
    </div>
  );
}

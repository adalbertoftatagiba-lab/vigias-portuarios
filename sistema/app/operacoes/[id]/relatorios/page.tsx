import Link from "next/link";
import { notFound } from "next/navigation";
import { montarDadosOperacao } from "@/lib/relatorios/dados";

export const dynamic = "force-dynamic";

const fmtR$ = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function RelatoriosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);

  let dados;
  try {
    dados = await montarDadosOperacao(operacaoId);
  } catch {
    notFound();
  }

  if (dados.resultadosPorVigia.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Relatórios — Operação nº {dados.operacao.numero}</h1>
        <p className="text-sm text-slate-600">
          Ainda não há apontamentos lançados nesta operação.{" "}
          <Link href={`/operacoes/${operacaoId}/apontamentos`} className="text-blue-700 hover:underline">
            Lançar apontamentos
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">
          Relatórios — Operação nº {dados.operacao.numero} — {dados.operacao.navio}
        </h1>
        <p className="text-sm text-slate-600">
          {dados.agencia.razaoSocial} · {dados.quantidadeTurnos} turnos · {dados.resultadosPorVigia.length} vigias
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={`/api/operacoes/${operacaoId}/folha`}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition"
        >
          <h2 className="font-semibold">Folhas de Pagamento (PDF)</h2>
          <p className="text-sm text-slate-600 mt-1">
            Um PDF com uma página por vigia, com o detalhe dos apontamentos e o cálculo individual.
          </p>
        </a>
        <a
          href={`/api/operacoes/${operacaoId}/cobranca`}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition"
        >
          <h2 className="font-semibold">Relatórios de Cobrança (PDF)</h2>
          <p className="text-sm text-slate-600 mt-1">
            3 páginas: Faturamento, Fatura de Serviços e Nota de Débito.
          </p>
        </a>
        {dados.agencia.percentualRepasse != null && dados.agencia.modeloNC && (
          <a
            href={`/api/operacoes/${operacaoId}/nota-credito`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition"
          >
            <h2 className="font-semibold">Nota de Crédito (PDF)</h2>
            <p className="text-sm text-slate-600 mt-1">
              Repasse de {dados.agencia.percentualRepasse}% à agência, modelo{" "}
              {dados.agencia.modeloNC === "ALL_FLAGS" ? "All Flags" : "North Star"}.
            </p>
          </a>
        )}
        {dados.lancha && (
          <a
            href={`/api/operacoes/${operacaoId}/fatura-lancha`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition"
          >
            <h2 className="font-semibold">Fatura de Serviços — Lancha (PDF)</h2>
            <p className="text-sm text-slate-600 mt-1">Nº {dados.lancha.numero}, numeração própria e sequencial.</p>
          </a>
        )}
        {dados.lancha && dados.agencia.percentualRepasse != null && (
          <a
            href={`/api/operacoes/${operacaoId}/nota-credito-lancha`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition"
          >
            <h2 className="font-semibold">Nota de Crédito — Lancha (PDF)</h2>
            <p className="text-sm text-slate-600 mt-1">Repasse de {dados.agencia.percentualRepasse}% sobre a fatura de lancha.</p>
          </a>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-medium mb-3">Resumo do Faturamento</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">MMO Vigias</dt>
            <dd className="font-medium">{fmtR$(dados.faturamento.mmoVigias)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Encargos (59,62%)</dt>
            <dd className="font-medium">{fmtR$(dados.faturamento.encargos)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Sub Total</dt>
            <dd className="font-medium">{fmtR$(dados.faturamento.subTotal)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Administração (90%)</dt>
            <dd className="font-medium">{fmtR$(dados.faturamento.administracao)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Benefícios (VT+VR)</dt>
            <dd className="font-medium">{fmtR$(dados.faturamento.beneficios)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Total (Faturamento)</dt>
            <dd className="font-medium">{fmtR$(dados.faturamento.total)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fatura de Serviços</dt>
            <dd className="font-medium">{fmtR$(dados.faturaServicos)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nota de Débito</dt>
            <dd className="font-medium">{fmtR$(dados.notaDebito)}</dd>
          </div>
          {dados.lancha && (
            <div>
              <dt className="text-slate-500">Fatura de Lancha (nº {dados.lancha.numero})</dt>
              <dd className="font-medium">{fmtR$(dados.lancha.valor)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div>
        <h2 className="font-medium mb-2">Folha por vigia</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2">Matr.</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2 text-right">Total (Proventos)</th>
                <th className="px-3 py-2 text-right">INSS</th>
                <th className="px-3 py-2 text-right">DAS</th>
                <th className="px-3 py-2 text-right">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {dados.resultadosPorVigia.map((r) => (
                <tr key={r.vigiaId} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">{r.matricula}</td>
                  <td className="px-3 py-1.5">{r.nome}</td>
                  <td className="px-3 py-1.5 text-right">{fmtR$(r.totalProventos)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtR$(r.inss)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtR$(r.das)}</td>
                  <td className="px-3 py-1.5 text-right">{fmtR$(r.liquido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

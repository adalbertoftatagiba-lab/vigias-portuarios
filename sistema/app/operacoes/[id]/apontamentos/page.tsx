import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gradeDoPorto, LOCAL_LABEL, Local, rotuloSlotComHora, slotDoApontamento } from "@/lib/tipos";
import { criarApontamento, excluirApontamento, gerarApontamentosAutomaticos, salvarAjuste } from "./actions";

export const dynamic = "force-dynamic";

function fmtData(d: Date) {
  return d.toISOString().slice(0, 10).split("-").reverse().join("/");
}

function fmtHora(h: number) {
  return String(h).padStart(2, "0") + "h";
}

export default async function ApontamentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);

  const operacao = await prisma.operacao.findUnique({
    where: { id: operacaoId },
    include: { agencia: true },
  });
  if (!operacao) notFound();

  const [vigias, apontamentos] = await Promise.all([
    prisma.vigia.findMany({ orderBy: { matricula: "asc" } }),
    prisma.apontamento.findMany({
      where: { operacaoId },
      orderBy: { data: "asc" },
      include: { vigia: true },
    }),
  ]);

  // A hora inicial sozinha não dá a ordem certa do dia (o 4º período, de
  // madrugada, tem hora menor que o 1º) — reordena pelo slot real (1º a 4º).
  apontamentos.sort((a, b) => {
    if (a.data.getTime() !== b.data.getTime()) return a.data.getTime() - b.data.getTime();
    return slotDoApontamento(operacao.porto, a.periodoInicial) - slotDoApontamento(operacao.porto, b.periodoInicial);
  });

  const grade = gradeDoPorto(operacao.porto);

  const vigiaIdsUsados = [...new Set(apontamentos.map((a) => a.vigiaId))];
  const ajustes = await prisma.ajusteFolha.findMany({
    where: { operacaoId, vigiaId: { in: vigiaIdsUsados } },
  });
  const ajustePorVigia = new Map(ajustes.map((a) => [a.vigiaId, a]));
  const vigiasUsados = vigias.filter((v) => vigiaIdsUsados.includes(v.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">
            Operação nº {operacao.numero} — {operacao.navio}
          </h1>
          <p className="text-sm text-slate-600">
            {operacao.agencia.razaoSocial} · {operacao.porto} · {LOCAL_LABEL[operacao.local as Local]} ·{" "}
            {fmtData(operacao.dataInicial)} ({rotuloSlotComHora(operacao.porto, operacao.slotInicial)}) a{" "}
            {fmtData(operacao.dataFinal)} ({rotuloSlotComHora(operacao.porto, operacao.slotFinal)}) · Vigias:{" "}
            {operacao.modoVigia === "ALEATORIO" ? "sorteados automaticamente" : "digitados manualmente"}
          </p>
        </div>
        <Link href={`/operacoes/${operacao.id}/relatorios`} className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
          Ir para relatórios
        </Link>
      </div>

      {operacao.modoVigia === "ALEATORIO" && (
        <form action={gerarApontamentosAutomaticos} className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
          <input type="hidden" name="operacaoId" value={operacao.id} />
          <p className="text-sm text-slate-600">
            Os períodos já foram sorteados automaticamente ao criar a operação. Use este botão só se precisar
            completar algum período pendente (ex: vigia cadastrado depois).
          </p>
          <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700 whitespace-nowrap">
            Completar períodos pendentes
          </button>
        </form>
      )}

      <form action={criarApontamento} className="grid gap-3 sm:grid-cols-6 items-end rounded-lg border border-slate-200 bg-white p-4">
        <input type="hidden" name="operacaoId" value={operacao.id} />
        {operacao.modoVigia === "ALEATORIO" ? (
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-600">Vigia</label>
            <p className="rounded border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-sm text-slate-500">
              Sorteado automaticamente
            </p>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-600">Vigia</label>
            <select name="vigiaId" required className="w-full rounded border border-slate-300 px-2 py-1">
              <option value="">Selecione...</option>
              {vigias.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.matricula} - {v.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-600">Data</label>
          <input name="data" type="date" required className="w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-600">Período</label>
          <select name="slot" required className="w-full rounded border border-slate-300 px-2 py-1">
            {grade.map((j, i) => (
              <option key={i} value={i}>
                {fmtHora(j.inicial)}–{fmtHora(j.final)} ({j.periodo === "DIA" ? "Dia" : "Noite"})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-6">
          <label className="block text-xs text-slate-600">Movimentação (opcional)</label>
          <input name="movimentacao" type="text" placeholder="ex: REEMBARQUE" className="w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <div>
          <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
            Adicionar
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Vigia</th>
              <th className="px-3 py-2">Período</th>
              <th className="px-3 py-2">Movimentação</th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {apontamentos.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-3 py-1.5">{fmtData(a.data)}</td>
                <td className="px-3 py-1.5">
                  {a.vigia.matricula} - {a.vigia.nome}
                </td>
                <td className="px-3 py-1.5">
                  {fmtHora(a.periodoInicial)}–{fmtHora(a.periodoFinal)} (
                  {a.periodo === "DIA" ? "Dia" : "Noite"})
                </td>
                <td className="px-3 py-1.5">{a.movimentacao}</td>
                <td className="px-3 py-1.5">
                  <form action={excluirApontamento}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="operacaoId" value={operacao.id} />
                    <button type="submit" className="text-red-700 hover:underline">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {apontamentos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                  Nenhum apontamento lançado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {vigiasUsados.length > 0 && (
        <div>
          <h2 className="font-medium mb-2">Ajustes manuais (Pensão / Crédito / Débito)</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-3 py-2">Vigia</th>
                  <th className="px-3 py-2 w-32">Pensão</th>
                  <th className="px-3 py-2 w-32">Crédito</th>
                  <th className="px-3 py-2 w-32">Débito</th>
                  <th className="px-3 py-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {vigiasUsados.map((v) => {
                  const ajuste = ajustePorVigia.get(v.id);
                  const formId = `ajuste-${v.id}`;
                  return (
                    <tr key={v.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">
                        {v.matricula} - {v.nome}
                        <form id={formId} action={salvarAjuste}>
                          <input type="hidden" name="operacaoId" value={operacao.id} />
                          <input type="hidden" name="vigiaId" value={v.id} />
                        </form>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          form={formId}
                          name="pensao"
                          type="number"
                          step="0.01"
                          defaultValue={ajuste?.pensao ?? 0}
                          className="w-28 rounded border border-slate-300 px-1 py-0.5"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          form={formId}
                          name="credito"
                          type="number"
                          step="0.01"
                          defaultValue={ajuste?.credito ?? 0}
                          className="w-28 rounded border border-slate-300 px-1 py-0.5"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          form={formId}
                          name="debito"
                          type="number"
                          step="0.01"
                          defaultValue={ajuste?.debito ?? 0}
                          className="w-28 rounded border border-slate-300 px-1 py-0.5"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <button form={formId} type="submit" className="text-blue-700 hover:underline">
                          Salvar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

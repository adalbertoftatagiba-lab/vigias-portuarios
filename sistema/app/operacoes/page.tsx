import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LOCAL_LABEL, Local, ROTULOS_SLOT_GENERICO, rotuloSlotComHora } from "@/lib/tipos";
import { atualizarOperacao, criarOperacao, excluirOperacao } from "./actions";

export const dynamic = "force-dynamic";

const campoCls = "w-full rounded border border-slate-300 px-2 py-1";
const labelCls = "block text-xs text-slate-600";

function fmtData(d: Date) {
  return d.toISOString().slice(0, 10).split("-").reverse().join("/");
}

function fmtDataInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Agencia = { id: number; razaoSocial: string };

function CamposOperacao({
  agencias,
  valores,
}: {
  agencias: Agencia[];
  valores?: {
    navio: string;
    porto: string;
    agenciaId: number;
    dataInicial: Date;
    dataFinal: Date;
    slotInicial: number;
    slotFinal: number;
    local: string;
    modoVigia: string;
  };
}) {
  return (
    <>
      <div>
        <label className={labelCls}>Navio</label>
        <input name="navio" required defaultValue={valores?.navio} className={campoCls} />
      </div>
      <div>
        <label className={labelCls}>Porto/Cidade</label>
        <select name="porto" required defaultValue={valores?.porto ?? "RIO DE JANEIRO"} className={campoCls}>
          <option value="RIO DE JANEIRO">Rio de Janeiro</option>
          <option value="ITAGUAI">Itaguaí</option>
          <option value="MANGARATIBA">Mangaratiba</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Agência</label>
        <select name="agenciaId" required defaultValue={valores?.agenciaId ?? ""} className={campoCls}>
          <option value="">Selecione...</option>
          {agencias.map((a) => (
            <option key={a.id} value={a.id}>
              {a.razaoSocial}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data inicial</label>
          <input
            name="dataInicial"
            type="date"
            required
            defaultValue={valores ? fmtDataInput(valores.dataInicial) : undefined}
            className={campoCls}
          />
        </div>
        <div>
          <label className={labelCls}>Período em que o trabalho começou</label>
          <select name="slotInicial" required defaultValue={valores?.slotInicial ?? 0} className={campoCls}>
            {ROTULOS_SLOT_GENERICO.map((rotulo, i) => (
              <option key={i} value={i}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data final</label>
          <input
            name="dataFinal"
            type="date"
            required
            defaultValue={valores ? fmtDataInput(valores.dataFinal) : undefined}
            className={campoCls}
          />
        </div>
        <div>
          <label className={labelCls}>Último período trabalhado</label>
          <select name="slotFinal" required defaultValue={valores?.slotFinal ?? 3} className={campoCls}>
            {ROTULOS_SLOT_GENERICO.map((rotulo, i) => (
              <option key={i} value={i}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Local do navio</label>
        <select name="local" required defaultValue={valores?.local ?? "ATRACADO"} className={campoCls}>
          <option value="ATRACADO">Atracado</option>
          <option value="AO_LARGO">Ao Largo</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-slate-600 mb-1">Preenchimento dos vigias nesta operação</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="modoVigia" value="MANUAL" defaultChecked={(valores?.modoVigia ?? "MANUAL") === "MANUAL"} />
            Digitar manualmente
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="modoVigia" value="ALEATORIO" defaultChecked={valores?.modoVigia === "ALEATORIO"} />
            Sortear automaticamente
          </label>
        </div>
      </div>
    </>
  );
}

export default async function OperacoesPage() {
  const [operacoes, agencias] = await Promise.all([
    prisma.operacao.findMany({
      orderBy: { numero: "desc" },
      include: { agencia: true, _count: { select: { apontamentos: true } } },
    }),
    prisma.agencia.findMany({ orderBy: { razaoSocial: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Operações</h1>
        <p className="text-sm text-slate-600">Cada operação agrupa os apontamentos de um navio + agência.</p>
      </div>

      <details className="rounded-lg border border-slate-200 bg-white p-4" open={operacoes.length === 0}>
        <summary className="cursor-pointer font-medium text-sm">+ Nova operação</summary>
        <form action={criarOperacao} className="mt-3 grid gap-3 sm:grid-cols-2">
          <CamposOperacao agencias={agencias} />
          <div className="sm:col-span-2">
            <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
              Criar e ir para apontamentos
            </button>
          </div>
        </form>
      </details>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">Nº</th>
              <th className="px-3 py-2">Navio</th>
              <th className="px-3 py-2">Agência</th>
              <th className="px-3 py-2">Local</th>
              <th className="px-3 py-2">Período</th>
              <th className="px-3 py-2">Apontamentos</th>
              <th className="px-3 py-2 w-48"></th>
            </tr>
          </thead>
          <tbody>
            {operacoes.map((op) => (
              <Fragment key={op.id}>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-1.5">{op.numero}</td>
                  <td className="px-3 py-1.5">{op.navio}</td>
                  <td className="px-3 py-1.5">{op.agencia.razaoSocial}</td>
                  <td className="px-3 py-1.5">{LOCAL_LABEL[op.local as Local]}</td>
                  <td className="px-3 py-1.5">
                    <div>
                      {fmtData(op.dataInicial)} – {fmtData(op.dataFinal)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rotuloSlotComHora(op.porto, op.slotInicial)} até {rotuloSlotComHora(op.porto, op.slotFinal)}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">{op._count.apontamentos}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <Link href={`/operacoes/${op.id}/apontamentos`} className="text-blue-700 hover:underline mr-3">
                      Apontamentos
                    </Link>
                    <Link href={`/operacoes/${op.id}/relatorios`} className="text-blue-700 hover:underline mr-3">
                      Relatórios
                    </Link>
                    <form action={excluirOperacao} className="inline">
                      <input type="hidden" name="id" value={op.id} />
                      <button type="submit" className="text-red-700 hover:underline">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
                <tr className="border-t border-slate-100 bg-slate-50/60">
                  <td colSpan={7} className="px-3 py-1.5">
                    <details>
                      <summary className="cursor-pointer text-xs text-blue-700 hover:underline">
                        Editar dados desta operação
                      </summary>
                      <form action={atualizarOperacao} className="mt-3 grid max-w-3xl gap-3 pb-2 sm:grid-cols-2">
                        <input type="hidden" name="id" value={op.id} />
                        <CamposOperacao agencias={agencias} valores={op} />
                        <p className="text-xs text-slate-500 sm:col-span-2">
                          Só corrige os dados cadastrais da operação — não move nem apaga apontamentos já lançados.
                        </p>
                        <div className="sm:col-span-2">
                          <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
                            Salvar alterações
                          </button>
                        </div>
                      </form>
                    </details>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

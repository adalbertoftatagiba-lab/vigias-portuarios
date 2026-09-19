import { prisma } from "@/lib/prisma";
import { criarAgencia, atualizarAgencia, excluirAgencia } from "./actions";
import { CamposRepasse } from "./CamposRepasse";

export const dynamic = "force-dynamic";

const campoCls = "w-full rounded border border-slate-300 px-2 py-1 text-sm";
const labelCls = "block text-xs text-slate-600";

function CamposAgencia({ prefixId }: { prefixId: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={labelCls}>CNPJ</label>
        <input name="cnpj" required form={prefixId} className={campoCls} />
      </div>
      <div>
        <label className={labelCls}>Razão Social</label>
        <input name="razaoSocial" required form={prefixId} className={campoCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Endereço</label>
        <input name="endereco" form={prefixId} className={campoCls} />
      </div>
      <div>
        <label className={labelCls}>CEP</label>
        <input name="cep" form={prefixId} className={campoCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Cidade</label>
          <input name="cidade" form={prefixId} className={campoCls} />
        </div>
        <div>
          <label className={labelCls}>UF</label>
          <input name="uf" form={prefixId} className={campoCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Telefone</label>
        <input name="telefone" form={prefixId} className={campoCls} />
      </div>
      <div>
        <label className={labelCls}>E-mail</label>
        <input name="email" form={prefixId} className={campoCls} />
      </div>
      <CamposRepasse prefixId={prefixId} />
    </div>
  );
}

export default async function AgenciasPage() {
  const agencias = await prisma.agencia.findMany({ orderBy: { razaoSocial: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Agências</h1>
        <p className="text-sm text-slate-600">{agencias.length} agências cadastradas</p>
      </div>

      <details className="rounded-lg border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-medium text-sm">+ Nova agência</summary>
        <form action={criarAgencia} id="form-nova-agencia" className="mt-3 space-y-3">
          <CamposAgencia prefixId="form-nova-agencia" />
          <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">
            Adicionar
          </button>
        </form>
      </details>

      <div className="grid gap-4 md:grid-cols-2">
        {agencias.map((a) => {
          const formId = `form-agencia-${a.id}`;
          return (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <form action={atualizarAgencia} id={formId}>
                <input type="hidden" name="id" value={a.id} />
              </form>
              <CamposAgenciaValores prefixId={formId} agencia={a} />
              <div className="mt-3 flex gap-3">
                <button form={formId} type="submit" className="text-blue-700 hover:underline text-sm">
                  Salvar
                </button>
                <form action={excluirAgencia}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-red-700 hover:underline text-sm">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CamposAgenciaValores({
  prefixId,
  agencia,
}: {
  prefixId: string;
  agencia: {
    cnpj: string;
    razaoSocial: string;
    endereco: string;
    cep: string;
    cidade: string;
    uf: string;
    telefone: string | null;
    email: string | null;
    percentualRepasse: number | null;
    modeloNC: string | null;
    valorLancha: number | null;
    dadosBancariosAlternativos: string | null;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={labelCls}>CNPJ</label>
        <input name="cnpj" required form={prefixId} defaultValue={agencia.cnpj} className={campoCls} />
      </div>
      <div>
        <label className={labelCls}>Razão Social</label>
        <input name="razaoSocial" required form={prefixId} defaultValue={agencia.razaoSocial} className={campoCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Endereço</label>
        <input name="endereco" form={prefixId} defaultValue={agencia.endereco} className={campoCls} />
      </div>
      <div>
        <label className={labelCls}>CEP</label>
        <input name="cep" form={prefixId} defaultValue={agencia.cep} className={campoCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Cidade</label>
          <input name="cidade" form={prefixId} defaultValue={agencia.cidade} className={campoCls} />
        </div>
        <div>
          <label className={labelCls}>UF</label>
          <input name="uf" form={prefixId} defaultValue={agencia.uf} className={campoCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Telefone</label>
        <input name="telefone" form={prefixId} defaultValue={agencia.telefone ?? ""} className={campoCls} />
      </div>
      <div>
        <label className={labelCls}>E-mail</label>
        <input name="email" form={prefixId} defaultValue={agencia.email ?? ""} className={campoCls} />
      </div>
      <CamposRepasse
        prefixId={prefixId}
        percentualInicial={agencia.percentualRepasse}
        modeloInicial={agencia.modeloNC}
        valorLanchaInicial={agencia.valorLancha}
        dadosBancariosAlternativosInicial={agencia.dadosBancariosAlternativos}
      />
    </div>
  );
}

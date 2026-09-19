"use client";

import { useState } from "react";

const campoCls = "w-full rounded border border-slate-300 px-2 py-1 text-sm";
const labelCls = "block text-xs text-slate-600";

/**
 * % de repasse (Nota de Crédito) + valor de Lancha de uma agência. O select de
 * modelo da NC só aparece quando o percentual está preenchido — é a "pergunta"
 * de qual versão usar, feita no cadastro em vez de a cada geração de relatório.
 */
export function CamposRepasse({
  prefixId,
  percentualInicial,
  modeloInicial,
  valorLanchaInicial,
  dadosBancariosAlternativosInicial,
}: {
  prefixId: string;
  percentualInicial?: number | null;
  modeloInicial?: string | null;
  valorLanchaInicial?: number | null;
  dadosBancariosAlternativosInicial?: string | null;
}) {
  const [percentual, setPercentual] = useState(percentualInicial != null ? String(percentualInicial) : "");
  const temRepasse = percentual.trim() !== "" && Number(percentual) > 0;

  return (
    <>
      <div>
        <label className={labelCls}>% de Repasse à agência (opcional)</label>
        <input
          name="percentualRepasse"
          type="number"
          step="0.01"
          form={prefixId}
          value={percentual}
          onChange={(e) => setPercentual(e.target.value)}
          className={campoCls}
        />
      </div>
      {temRepasse ? (
        <div>
          <label className={labelCls}>Modelo da Nota de Crédito</label>
          <select name="modeloNC" form={prefixId} required defaultValue={modeloInicial ?? ""} className={campoCls}>
            <option value="">Selecione...</option>
            <option value="ALL_FLAGS">All Flags (desconto sobre a Administração, abate do total geral)</option>
            <option value="NORTH_STAR">North Star (desconto direto sobre o valor da fatura)</option>
          </select>
        </div>
      ) : (
        <input type="hidden" name="modeloNC" value="" form={prefixId} />
      )}
      <div>
        <label className={labelCls}>Valor do serviço de Lancha (R$/período, opcional)</label>
        <input
          name="valorLancha"
          type="number"
          step="0.01"
          form={prefixId}
          defaultValue={valorLanchaInicial ?? ""}
          className={campoCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>
          Dados bancários alternativos p/ Relatório de Faturamento (opcional — uma linha por campo; deixe em branco
          para usar a conta padrão do sindicato)
        </label>
        <textarea
          name="dadosBancariosAlternativos"
          form={prefixId}
          rows={4}
          defaultValue={dadosBancariosAlternativosInicial ?? ""}
          className={campoCls}
        />
      </div>
    </>
  );
}

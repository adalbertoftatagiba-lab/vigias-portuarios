import { NextRequest, NextResponse } from "next/server";
import { montarDadosOperacao } from "@/lib/relatorios/dados";
import { DadosNotaCredito, gerarNotaCreditoAllFlagsPdf, gerarNotaCreditoNorthStarPdf } from "@/lib/relatorios/notaCredito";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);
  const dados = await montarDadosOperacao(operacaoId);

  if (!dados.agencia.percentualRepasse || !dados.agencia.modeloNC) {
    return NextResponse.json({ error: "Esta agência não tem percentual de repasse configurado." }, { status: 404 });
  }

  const dadosCarta: DadosNotaCredito = {
    razaoSocial: dados.agencia.razaoSocial,
    navio: dados.operacao.navio,
    dataInicial: dados.operacao.dataInicial,
    dataFinal: dados.operacao.dataFinal,
    numero: dados.operacao.numero,
    percentual: dados.agencia.percentualRepasse,
    quantidadeTurnos: dados.quantidadeTurnos,
  };

  const buffer =
    dados.agencia.modeloNC === "ALL_FLAGS"
      ? await gerarNotaCreditoAllFlagsPdf(dadosCarta, dados.faturamento)
      : await gerarNotaCreditoNorthStarPdf(dadosCarta, dados.faturaServicos);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Nota de Credito - Op ${dados.operacao.numero}.pdf"`,
    },
  });
}

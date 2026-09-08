import { NextRequest, NextResponse } from "next/server";
import { montarDadosOperacao } from "@/lib/relatorios/dados";
import { DadosNotaCredito, gerarNotaCreditoNorthStarPdf } from "@/lib/relatorios/notaCredito";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);
  const dados = await montarDadosOperacao(operacaoId);

  if (!dados.lancha || !dados.agencia.percentualRepasse) {
    return NextResponse.json({ error: "Esta operação não tem serviço de lancha e/ou percentual de repasse configurado." }, { status: 404 });
  }

  const dadosCarta: DadosNotaCredito = {
    razaoSocial: dados.agencia.razaoSocial,
    navio: dados.operacao.navio,
    dataInicial: dados.operacao.dataInicial,
    dataFinal: dados.operacao.dataFinal,
    numero: dados.lancha.numero,
    percentual: dados.agencia.percentualRepasse,
    quantidadeTurnos: dados.quantidadeTurnos,
    tipoServico: "Lancha Portuário",
  };

  const buffer = await gerarNotaCreditoNorthStarPdf(dadosCarta, dados.lancha.valor);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Nota de Credito Lancha - Op ${dados.lancha.numero}.pdf"`,
    },
  });
}

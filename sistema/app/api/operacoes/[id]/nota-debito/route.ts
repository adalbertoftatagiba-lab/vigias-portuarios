import { NextRequest, NextResponse } from "next/server";
import { montarDadosOperacao } from "@/lib/relatorios/dados";
import { gerarNotaDebitoPdf } from "@/lib/relatorios/cobranca";
import { nomeArquivoSeguro } from "@/lib/relatorios/pdf-estilos";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);
  const dados = await montarDadosOperacao(operacaoId);
  const buffer = await gerarNotaDebitoPdf(dados);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ND ${nomeArquivoSeguro(dados.operacao.navio)} ${dados.operacao.numero}.pdf"`,
    },
  });
}

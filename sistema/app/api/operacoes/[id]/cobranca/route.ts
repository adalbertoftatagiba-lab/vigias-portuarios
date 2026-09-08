import { NextRequest, NextResponse } from "next/server";
import { montarDadosOperacao } from "@/lib/relatorios/dados";
import { gerarCobrancaPdf } from "@/lib/relatorios/cobranca";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);
  const dados = await montarDadosOperacao(operacaoId);
  const buffer = await gerarCobrancaPdf(dados);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Relatorios de Cobranca - Op ${dados.operacao.numero}.pdf"`,
    },
  });
}

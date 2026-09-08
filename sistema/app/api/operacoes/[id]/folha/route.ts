import { NextRequest, NextResponse } from "next/server";
import { montarDadosOperacao } from "@/lib/relatorios/dados";
import { gerarFolhaPdf } from "@/lib/relatorios/folha";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);
  const dados = await montarDadosOperacao(operacaoId);
  const buffer = await gerarFolhaPdf(dados);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Folha de Pagamento - Op ${dados.operacao.numero}.pdf"`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { montarDadosOperacao } from "@/lib/relatorios/dados";
import { gerarFaturaLanchaPdf } from "@/lib/relatorios/cobranca";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operacaoId = Number(id);
  const dados = await montarDadosOperacao(operacaoId);

  if (!dados.lancha) {
    return NextResponse.json({ error: "Esta operação não tem serviço de lancha configurado." }, { status: 404 });
  }

  const buffer = await gerarFaturaLanchaPdf(dados);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Fatura de Servicos - Lancha - Op ${dados.lancha.numero}.pdf"`,
    },
  });
}

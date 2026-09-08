import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { ResultadoFaturamento, calcularNotaCreditoAllFlags, calcularNotaCreditoSobreValor } from "@/lib/calculo";
import { fmtDataBR, fmtDataPorExtenso, fmtMoeda, porExtenso } from "./pdf-estilos";

const estilosCarta = StyleSheet.create({
  pagina: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  titulo: { fontSize: 14, fontWeight: 700, textAlign: "center" },
  linhaTitulo: { borderBottomWidth: 1, borderColor: "#1e293b", marginTop: 4, marginBottom: 10 },
  cabecalhoTexto: { fontSize: 9, textAlign: "center", marginBottom: 2 },
  data: { marginTop: 16, marginBottom: 16 },
  destinatario: { fontWeight: 700, marginBottom: 2 },
  ref: { fontWeight: 700, marginBottom: 14 },
  paragrafo: { marginBottom: 12, lineHeight: 1.4 },
  banco: { marginTop: 2, marginBottom: 16 },
  bancoLinha: { marginBottom: 1 },
  assinatura: { marginTop: 40 },
  assinaturaNome: { fontWeight: 700 },
});

/** Cabeçalho/letterhead do sindicato, igual em todas as Notas de Crédito. */
function Cabecalho() {
  return (
    <>
      <Text style={estilosCarta.titulo}>SINDICATO DOS VIGIAS PORTUÁRIOS DO ESTADO DO RIO DE JANEIRO</Text>
      <View style={estilosCarta.linhaTitulo} />
      <Text style={estilosCarta.cabecalhoTexto}>Fundado em 19 de novembro de 1948</Text>
      <Text style={estilosCarta.cabecalhoTexto}>Rua Sacadura Cabral, 120 - Grupos 401 a 403 - Tel.: (21) 2263-4430</Text>
      <Text style={estilosCarta.cabecalhoTexto}>Inscrição Municipal: 427.927.00     CNPJ: 34.160.960/0001-30</Text>
    </>
  );
}

function DadosBancarios() {
  return (
    <View style={estilosCarta.banco}>
      <Text style={estilosCarta.bancoLinha}>SINDICATO DOS VIGIAS PORTUÁRIOS DO ESTADO DO RIO DE JANEIRO</Text>
      <Text style={estilosCarta.bancoLinha}>CNPJ: 34.160.960/0001-30</Text>
      <Text style={estilosCarta.bancoLinha}>CAIXA ECONÔMICA FEDERAL</Text>
      <Text style={estilosCarta.bancoLinha}>AG. 0209</Text>
      <Text style={estilosCarta.bancoLinha}>OP: 1388</Text>
      <Text style={estilosCarta.bancoLinha}>C/POUPANÇA: 000718677787-3</Text>
    </View>
  );
}

function Assinatura() {
  return (
    <View style={estilosCarta.assinatura}>
      <Text style={estilosCarta.assinaturaNome}>Washington Luiz dos Santos</Text>
      <Text>Presidente</Text>
    </View>
  );
}

/**
 * Frase de período usada nas cartas de Nota de Crédito: "do dia 23 a 25/08/2026"
 * quando início e fim caem no mesmo mês/ano (só o dia do início, mês/ano só no
 * fim), ou "do dia 28/08/2026 a 02/09/2026" por extenso quando não caem.
 */
function formatarPeriodoCarta(dataInicial: Date, dataFinal: Date): string {
  if (dataInicial.getTime() === dataFinal.getTime()) return fmtDataBR(dataInicial);
  const mesmoMes = dataInicial.getUTCFullYear() === dataFinal.getUTCFullYear() && dataInicial.getUTCMonth() === dataFinal.getUTCMonth();
  const inicio = mesmoMes ? fmtDataBR(dataInicial).slice(0, 2) : fmtDataBR(dataInicial);
  return `${inicio} a ${fmtDataBR(dataFinal)}`;
}

export type DadosNotaCredito = {
  razaoSocial: string;
  navio: string;
  dataInicial: Date;
  dataFinal: Date;
  numero: number;
  percentual: number;
  quantidadeTurnos: number;
  tipoServico?: "Vigia Portuário" | "Lancha Portuário";
  prazoPagamento?: Date;
};

/** Modelo "All Flags": desconto sobre a Taxa de Administração, abatido do total geral da operação. */
export function gerarNotaCreditoAllFlagsPdf(dados: DadosNotaCredito, faturamento: ResultadoFaturamento) {
  const { valorDeduzido, valorLiquido } = calcularNotaCreditoAllFlags(faturamento, dados.percentual);
  const periodo = formatarPeriodoCarta(dados.dataInicial, dados.dataFinal);

  const documento = (
    <Document>
      <Page size="A4" style={estilosCarta.pagina}>
        <Cabecalho />
        <Text style={[estilosCarta.data, { textAlign: "right" }]}>Rio de Janeiro, {fmtDataPorExtenso(new Date())}.</Text>
        <Text style={estilosCarta.destinatario}>{dados.razaoSocial}</Text>
        <Text style={estilosCarta.ref}>Ref.: Nota de Crédito</Text>
        <Text style={estilosCarta.paragrafo}>Prezados Senhores,</Text>
        <Text style={estilosCarta.paragrafo}>
          Conforme acertos preliminares com v.sas., autorizamos um desconto de {dados.percentual}% ({porExtenso(dados.percentual)} por
          cento), a título de Nota de Crédito, sobre a Taxa de Administração, dos serviços prestados de Vigia Portuário ao Navio{" "}
          {dados.navio} do dia {periodo}, cobrada pela fatura nº {dados.numero} que segue em anexo.
        </Text>
        <Text style={estilosCarta.paragrafo}>
          Sendo assim, o valor a ser deduzido é de R$ {fmtMoeda(valorDeduzido)} e o valor total a ser pago é de R$ {fmtMoeda(valorLiquido)}
          . Segue abaixo os dados da conta para depósito:
        </Text>
        <DadosBancarios />
        <Text>Atenciosamente.</Text>
        <Assinatura />
      </Page>
    </Document>
  );

  return renderToBuffer(documento);
}

/** Modelo "North Star": desconto direto sobre o valor de uma fatura específica (vigia ou lancha). */
export function gerarNotaCreditoNorthStarPdf(dados: DadosNotaCredito, valorFatura: number) {
  const { valorLiquido } = calcularNotaCreditoSobreValor(valorFatura, dados.percentual);
  const tipoServico = dados.tipoServico ?? "Vigia Portuário";
  const periodo = formatarPeriodoCarta(dados.dataInicial, dados.dataFinal);
  const prazo = dados.prazoPagamento ?? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 10));

  const documento = (
    <Document>
      <Page size="A4" style={estilosCarta.pagina}>
        <Cabecalho />
        <Text style={[estilosCarta.data, { textAlign: "right" }]}>Rio de Janeiro, {fmtDataPorExtenso(new Date())}.</Text>
        <Text style={estilosCarta.destinatario}>{dados.razaoSocial}</Text>
        <Text style={estilosCarta.ref}>Ref.: Nota de Crédito</Text>
        <Text style={estilosCarta.paragrafo}>Prezados Senhores,</Text>
        <Text style={estilosCarta.paragrafo}>
          Conforme acertos preliminares com v.sas., autorizamos um desconto de {dados.percentual}% ({porExtenso(dados.percentual)} por
          cento), a título de Nota de Crédito dos serviços prestados de {tipoServico} ao Navio {dados.navio} do dia {periodo},
          considerando {dados.quantidadeTurnos} períodos, cobrada pela fatura nº {dados.numero} no valor de R$ {fmtMoeda(valorFatura)}, que
          segue em anexo.
        </Text>
        <Text style={estilosCarta.paragrafo}>
          Sendo assim, solicitamos o depósito do valor de R$ {fmtMoeda(valorLiquido)}, até o dia {fmtDataBR(prazo)}, na conta bancária
          abaixo descriminada:
        </Text>
        <DadosBancarios />
        <Text>Atenciosamente.</Text>
        <Assinatura />
      </Page>
    </Document>
  );

  return renderToBuffer(documento);
}

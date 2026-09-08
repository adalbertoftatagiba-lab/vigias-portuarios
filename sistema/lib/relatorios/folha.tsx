import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { LOCAL_LABEL, Local } from "@/lib/tipos";
import { ResultadoVigia } from "@/lib/calculo";
import { DadosOperacao, LinhaDetalhe } from "./dados";
import { estilos, fmtMoeda, fmtDataBR } from "./pdf-estilos";

function CampoHeader({
  label,
  valor,
  ultimo = false,
  largura,
}: {
  label: string;
  valor: string;
  ultimo?: boolean;
  largura?: string;
}) {
  const base = ultimo ? estilos.headerCampoUltimo : estilos.headerCampo;
  return (
    <View style={largura ? [base, { width: largura }] : base}>
      <Text style={estilos.headerLabel}>{label}</Text>
      <Text style={estilos.headerValor}>{valor}</Text>
    </View>
  );
}

function ItemCalculo({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={estilos.itemLinha}>
      <Text style={estilos.itemLabel}>{label}</Text>
      <Text style={estilos.itemValor}>R$ {fmtMoeda(valor)}</Text>
    </View>
  );
}

function PaginaVigia({
  dados,
  resultado,
  linhas,
}: {
  dados: DadosOperacao;
  resultado: ResultadoVigia;
  linhas: LinhaDetalhe[];
}) {
  const datas = linhas.map((l) => l.data.getTime());
  const dataMin = new Date(Math.min(...datas));
  const dataMax = new Date(Math.max(...datas));
  const textoData = dataMin.getTime() === dataMax.getTime() ? fmtDataBR(dataMin) : `${fmtDataBR(dataMin)} a ${fmtDataBR(dataMax)}`;

  const contagemLocal = new Map<Local, number>();
  for (const l of linhas) contagemLocal.set(l.local, (contagemLocal.get(l.local) ?? 0) + 1);
  let localVigia: Local = linhas[0]?.local ?? dados.operacao.localPredominante;
  let max = -1;
  for (const [loc, qtd] of contagemLocal) {
    if (qtd > max) {
      max = qtd;
      localVigia = loc;
    }
  }

  return (
    <Page size="A4" style={estilos.pagina}>
      <Text style={estilos.tituloSindicato}>
        Sindicato dos Vigias Portuários do Estado do Rio de Janeiro - CNPJ: 34.160.960/0001-30
      </Text>
      <Text style={estilos.subtitulo}>Folha de Pagamento a Trabalhador Avulso Portuário - Vigia Portuário</Text>

      <View style={estilos.headerGrid}>
        <CampoHeader label="Matrícula" valor={String(resultado.matricula)} largura="10%" />
        <CampoHeader label="Nome do Vigia" valor={resultado.nome} largura="30%" />
        <CampoHeader label="Data(s) Trabalhada(s)" valor={textoData} largura="20%" />
        <CampoHeader label="Porto/Cidade" valor={dados.operacao.porto} largura="20%" />
        <CampoHeader label="Local" valor={LOCAL_LABEL[localVigia]} largura="20%" ultimo />
      </View>
      <View style={estilos.headerGrid}>
        <CampoHeader label="Nome da Embarcação" valor={dados.operacao.navio} largura="50%" />
        <CampoHeader label="Agência/Operador Portuário" valor={dados.agencia.razaoSocial} largura="50%" ultimo />
      </View>

      <Text style={estilos.secaoTitulo}>Apontamentos</Text>
      <View style={estilos.linhaTabelaHeader}>
        <Text style={[estilos.celulaCabecalho, estilos.centro, { width: "12%" }]}>Data</Text>
        <Text style={[estilos.celulaCabecalho, estilos.centro, { width: "10%" }]}>Período</Text>
        <Text style={[estilos.celulaCabecalho, estilos.centro, { width: "10%" }]}>Tipo</Text>
        <Text style={[estilos.celulaCabecalho, estilos.centro, { width: "13%" }]}>Tipo de Dia</Text>
        <Text style={[estilos.celulaCabecalho, estilos.centro, { width: "10%" }]}>Horas</Text>
        <Text style={[estilos.celulaCabecalho, estilos.direita, { width: "15%" }]}>Valor Hora</Text>
        <Text style={[estilos.celulaCabecalho, estilos.direita, { width: "15%", paddingRight: 6 }]}>MMO Bruta</Text>
        <Text style={[estilos.celulaCabecalho, estilos.esquerda, { width: "15%", paddingLeft: 6 }]}>Movimentação</Text>
      </View>
      {linhas.map((l, i) => (
        <View style={estilos.linhaTabela} key={i}>
          <Text style={[estilos.centro, { width: "12%" }]}>{fmtDataBR(l.data)}</Text>
          <Text style={[estilos.centro, { width: "10%" }]}>
            {String(l.periodoInicial).padStart(2, "0")}h–{String(l.periodoFinal).padStart(2, "0")}h
          </Text>
          <Text style={[estilos.centro, { width: "10%" }]}>{l.periodo === "DIA" ? "Dia" : "Noite"}</Text>
          <Text style={[estilos.centro, { width: "13%" }]}>{l.diaSemana}</Text>
          <Text style={[estilos.centro, { width: "10%" }]}>6</Text>
          <Text style={[estilos.direita, { width: "15%" }]}>{fmtMoeda(l.valorHora)}</Text>
          <Text style={[estilos.direita, { width: "15%", paddingRight: 6 }]}>{fmtMoeda(l.mmoBruta)}</Text>
          <Text style={[estilos.esquerda, { width: "15%", paddingLeft: 6 }]}>{l.movimentacao || "Reembarque"}</Text>
        </View>
      ))}

      <Text style={estilos.secaoTitulo}>Cálculo da Folha de Pagamento</Text>
      <View style={estilos.gridDuasColunas}>
        <View style={estilos.bloco}>
          <Text style={estilos.blocoTitulo}>Proventos</Text>
          <ItemCalculo label="MMO Bruta" valor={resultado.mmoBruta} />
          <ItemCalculo label="R.S.R (18,18%)" valor={resultado.rsr} />
          <ItemCalculo label="Total" valor={resultado.totalProventos} />
        </View>
        <View style={estilos.bloco}>
          <Text style={estilos.blocoTitulo}>Descontos</Text>
          <ItemCalculo label="INSS" valor={resultado.inss} />
          <ItemCalculo label="IRRF" valor={resultado.irrf} />
          <ItemCalculo label="DAS" valor={resultado.das} />
          <ItemCalculo label="Pensão" valor={resultado.pensao} />
        </View>
        <View style={estilos.bloco}>
          <Text style={estilos.blocoTitulo}>Diversos</Text>
          <ItemCalculo label="Crédito" valor={resultado.credito} />
          <ItemCalculo label="Débito" valor={resultado.debito} />
        </View>
        <View style={estilos.bloco}>
          <Text style={estilos.blocoTitulo}>Encargos Sociais (a cargo do empregador)</Text>
          <ItemCalculo label="13º Salário" valor={resultado.decimoTerceiro} />
          <ItemCalculo label="Férias" valor={resultado.ferias} />
          <ItemCalculo label="FGTS" valor={resultado.fgts} />
          <ItemCalculo label="INSS Patronal" valor={resultado.inssPatronal} />
        </View>
      </View>

      <View style={estilos.liquidoBox}>
        <Text style={estilos.liquidoLabel}>Líquido MMO a Receber</Text>
        <Text style={estilos.liquidoValor}>R$ {fmtMoeda(resultado.liquido)}</Text>
      </View>

      <View style={estilos.informativos}>
        <Text style={estilos.informativoTexto}>
          Os valores de MMO Bruta têm como origem a Tabela de Salário do Vigia Portuário emitida pelo OGMO/RJ, vigente
          na data de cada apontamento.
        </Text>
      </View>
    </Page>
  );
}

/** Gera um único PDF com uma página por vigia da operação. */
export async function gerarFolhaPdf(dados: DadosOperacao): Promise<Buffer> {
  const detalhesPorVigia = new Map<number, LinhaDetalhe[]>();
  for (const linha of dados.detalhesApontamentos) {
    const arr = detalhesPorVigia.get(linha.vigiaId) ?? [];
    arr.push(linha);
    detalhesPorVigia.set(linha.vigiaId, arr);
  }

  const documento = (
    <Document>
      {dados.resultadosPorVigia.map((resultado) => (
        <PaginaVigia key={resultado.vigiaId} dados={dados} resultado={resultado} linhas={detalhesPorVigia.get(resultado.vigiaId) ?? []} />
      ))}
    </Document>
  );

  return renderToBuffer(documento);
}

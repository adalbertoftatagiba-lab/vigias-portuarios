import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { LOCAL_LABEL, rotuloSlotComHora } from "@/lib/tipos";
import { DadosOperacao } from "./dados";
import { capitalizarPalavras, estilos, fmtMoeda, fmtDataBR, formatarEmail } from "./pdf-estilos";

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

function ItemCalculo({ label, valor, destaque = false }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <View style={estilos.itemLinha}>
      <Text style={destaque ? { ...estilos.itemLabel, fontWeight: 700 } : estilos.itemLabel}>{label}</Text>
      <Text style={estilos.itemValor}>R$ {fmtMoeda(valor)}</Text>
    </View>
  );
}

/**
 * Bloco de dados cadastrais de uma empresa (agência), reaproveitado como
 * "Dados Cadastrais - Agência" (Faturamento), "Tomador de Serviços" (Fatura
 * de Serviços) e "Destinatário" (Nota de Débito). Endereço fica em linha
 * própria (não divide espaço com mais nada) para nunca estourar a largura do
 * campo, e Telefone/E-mail sempre aparecem junto do endereço.
 */
function DadosAgencia({ dados, titulo, labelEmpresa = "Empresa" }: { dados: DadosOperacao; titulo: string; labelEmpresa?: string }) {
  return (
    <>
      <Text style={estilos.secaoTitulo}>{titulo}</Text>
      <View style={estilos.headerGrid}>
        <CampoHeader label="CNPJ" valor={dados.agencia.cnpj} largura="30%" />
        <CampoHeader label={labelEmpresa} valor={dados.agencia.razaoSocial} largura="70%" ultimo />
      </View>
      <View style={estilos.headerGrid}>
        <CampoHeader label="Endereço" valor={capitalizarPalavras(dados.agencia.endereco)} largura="100%" ultimo />
      </View>
      <View style={estilos.headerGrid}>
        <CampoHeader label="Cidade/UF" valor={`${capitalizarPalavras(dados.agencia.cidade)}/${dados.agencia.uf}`} largura="20%" />
        <CampoHeader label="CEP" valor={dados.agencia.cep} largura="15%" />
        <CampoHeader label="Telefone" valor={dados.agencia.telefone ?? ""} largura="20%" />
        <CampoHeader label="E-mail" valor={formatarEmail(dados.agencia.email ?? "")} largura="45%" ultimo />
      </View>
    </>
  );
}

/** Dados do sindicato como prestador/emissor, idênticos em Fatura de Serviços e Nota de Débito. */
function DadosSindicato({ titulo }: { titulo: string }) {
  return (
    <>
      <Text style={estilos.secaoTitulo}>{titulo}</Text>
      <View style={estilos.headerGrid}>
        <CampoHeader label="Empresa" valor="SINDICATO DOS VIGIAS PORTUÁRIOS DO ESTADO DO RIO DE JANEIRO" largura="70%" />
        <CampoHeader label="CNPJ" valor="34.160.960/0001-30" largura="30%" ultimo />
      </View>
      <View style={estilos.headerGrid}>
        <CampoHeader label="Endereço" valor="Rua Sacadura Cabral, 120 - Salas 401 a 403 - Saúde" largura="100%" ultimo />
      </View>
      <View style={estilos.headerGrid}>
        <CampoHeader label="Cidade/UF" valor="Rio de Janeiro/RJ" largura="20%" />
        <CampoHeader label="CEP" valor="20081-262" largura="15%" />
        <CampoHeader label="Telefone" valor="(21) 2263-4430" largura="20%" />
        <CampoHeader label="E-mail" valor="sindvig.secretario@gmail.com" largura="45%" ultimo />
      </View>
    </>
  );
}

/** Dados do navio/porto da operação, repetidos em Faturamento, Fatura de Serviços e Nota de Débito. */
function DadosNavioPorto({ dados, local }: { dados: DadosOperacao; local: string }) {
  return (
    <>
      <Text style={estilos.secaoTitulo}>Dados do Navio/Porto</Text>
      <View style={estilos.headerGrid}>
        <CampoHeader label="Nome do Navio" valor={dados.operacao.navio} largura="18%" />
        <CampoHeader label="Porto" valor={dados.operacao.porto} largura="16%" />
        <CampoHeader label="Local" valor={local} largura="16%" />
        <CampoHeader
          label="Data Inicial"
          valor={`${fmtDataBR(dados.operacao.dataInicial)} (${rotuloSlotComHora(dados.operacao.porto, dados.operacao.slotInicial)})`}
          largura="25%"
        />
        <CampoHeader
          label="Data Final"
          valor={`${fmtDataBR(dados.operacao.dataFinal)} (${rotuloSlotComHora(dados.operacao.porto, dados.operacao.slotFinal)})`}
          largura="25%"
          ultimo
        />
      </View>
    </>
  );
}

function RodapeBanco() {
  return (
    <View style={estilos.rodapeBanco}>
      <Text style={estilos.rodapeBancoTitulo}>MUITO IMPORTANTE</Text>
      <Text style={estilos.rodapeBancoTexto}>Os pagamentos devem ser realizados somente na conta abaixo descriminada:</Text>
      <Text style={estilos.rodapeBancoTexto}>SINDICATO DOS VIGIAS PORTUÁRIOS DO ESTADO DO RIO DE JANEIRO</Text>
      <Text style={estilos.rodapeBancoTexto}>CNPJ: 34.160.960/0001-30</Text>
      <Text style={estilos.rodapeBancoTexto}>CAIXA ECONÔMICA FEDERAL — AG. 0209 — OP: 1388 — C/POUPANÇA: 000718677787-3</Text>
    </View>
  );
}

function PaginaFaturamento({ dados, local }: { dados: DadosOperacao; local: string }) {
  const f = dados.faturamento;
  return (
    <Page size="A4" style={estilos.pagina}>
      <Text style={estilos.tituloSindicato}>RELATÓRIO DE FATURAMENTO</Text>
      <Text style={estilos.subtitulo}>Nº {dados.operacao.numero}</Text>

      <DadosNavioPorto dados={dados} local={local} />

      <DadosAgencia dados={dados} titulo="Dados Cadastrais - Agência" labelEmpresa="Agência" />

      <Text style={estilos.secaoTitulo}>Descrição dos Custos — Repasse com os Vigias Portuários</Text>
      <View style={estilos.gridDuasColunas}>
        <View style={estilos.bloco}>
          <ItemCalculo label="MMO Vigias" valor={f.mmoVigias} />
          <ItemCalculo label="Encargos (59,62%)" valor={f.encargos} />
          <ItemCalculo label="Sub Total" valor={f.subTotal} destaque />
        </View>
        <View style={estilos.bloco}>
          <ItemCalculo label="Administração (90%)" valor={f.administracao} />
          <ItemCalculo label={`Vale Transporte (${dados.quantidadeTurnos} turnos)`} valor={f.vt} />
          <ItemCalculo label={`Vale Refeição (${dados.quantidadeTurnos} turnos)`} valor={f.vr} />
        </View>
      </View>

      <View style={estilos.liquidoBox}>
        <Text style={estilos.liquidoLabel}>Total</Text>
        <Text style={estilos.liquidoValor}>R$ {fmtMoeda(f.total)}</Text>
      </View>

      <Text style={estilos.secaoTitulo}>Memória de Cálculo dos Encargos</Text>
      <View style={estilos.gridDuasColunas}>
        <View style={estilos.bloco}>
          <View style={estilos.itemLinha}>
            <Text style={estilos.itemLabel}>Previdência Patronal</Text>
            <Text style={estilos.itemValor}>28,713%</Text>
          </View>
          <View style={estilos.itemLinha}>
            <Text style={estilos.itemLabel}>13º Salário</Text>
            <Text style={estilos.itemValor}>9,09%</Text>
          </View>
        </View>
        <View style={estilos.bloco}>
          <View style={estilos.itemLinha}>
            <Text style={estilos.itemLabel}>Férias</Text>
            <Text style={estilos.itemValor}>12,12%</Text>
          </View>
          <View style={estilos.itemLinha}>
            <Text style={estilos.itemLabel}>FGTS</Text>
            <Text style={estilos.itemValor}>9,70%</Text>
          </View>
          <View style={estilos.itemLinha}>
            <Text style={{ ...estilos.itemLabel, fontWeight: 700 }}>Total dos Encargos</Text>
            <Text style={estilos.itemValor}>59,62%</Text>
          </View>
        </View>
      </View>

      <RodapeBanco />
    </Page>
  );
}

function PaginaFaturaServicos({
  dados,
  local,
  numero,
  descricaoServico,
  valor,
}: {
  dados: DadosOperacao;
  local: string;
  numero: number;
  descricaoServico: string;
  valor: number;
}) {
  const hoje = fmtDataBR(new Date());
  return (
    <Page size="A4" style={estilos.pagina}>
      <Text style={estilos.tituloSindicato}>FATURA DE SERVIÇOS</Text>
      <Text style={estilos.subtitulo}>
        Nº {numero} · Data: {hoje}
      </Text>

      <DadosSindicato titulo="Prestador de Serviços" />

      <DadosAgencia dados={dados} titulo="Tomador de Serviços" />

      <DadosNavioPorto dados={dados} local={local} />

      <Text style={estilos.secaoTitulo}>Descrição dos Serviços</Text>
      <View style={estilos.gridDuasColunas}>
        <View style={estilos.bloco}>
          <ItemCalculo label={descricaoServico} valor={valor} />
          <ItemCalculo label="Outros Créditos" valor={0} />
          <ItemCalculo label="Outros Débitos" valor={0} />
        </View>
      </View>

      <View style={estilos.liquidoBox}>
        <Text style={estilos.liquidoLabel}>Total</Text>
        <Text style={estilos.liquidoValor}>R$ {fmtMoeda(valor)}</Text>
      </View>
    </Page>
  );
}

function PaginaNotaDebito({ dados, local }: { dados: DadosOperacao; local: string }) {
  const hoje = fmtDataBR(new Date());
  return (
    <Page size="A4" style={estilos.pagina}>
      <Text style={estilos.tituloSindicato}>NOTA DE DÉBITO</Text>
      <Text style={estilos.subtitulo}>
        Nº {dados.operacao.numero} - Nat. Da Operação: Repasse de Custo - Data: {hoje}
      </Text>

      <DadosSindicato titulo="Dados do Sindicato" />

      <DadosAgencia dados={dados} titulo="Destinatário" />

      <DadosNavioPorto dados={dados} local={local} />

      <Text style={estilos.secaoTitulo}>Descrição das Cobranças</Text>
      <View style={estilos.gridDuasColunas}>
        <View style={estilos.bloco}>
          <ItemCalculo label="Repasse correspondente aos custos com Vigias Portuários" valor={dados.faturamento.subTotal} />
        </View>
        <View style={estilos.bloco}>
          <Text style={estilos.blocoTitulo}>Benefícios</Text>
          <ItemCalculo label="Vale Transporte" valor={dados.faturamento.vt} />
          <ItemCalculo label="Vale Refeição" valor={dados.faturamento.vr} />
        </View>
      </View>

      <View style={estilos.liquidoBox}>
        <Text style={estilos.liquidoLabel}>Total</Text>
        <Text style={estilos.liquidoValor}>R$ {fmtMoeda(dados.notaDebito)}</Text>
      </View>

      <View style={estilos.informativos}>
        <Text style={estilos.informativoTexto}>
          Declaramos que o Sindicato dos Vigias Portuários do Est. RJ, prestou os serviços constantes neste documento.
        </Text>
        <Text style={{ ...estilos.informativoTexto, marginTop: 20 }}>
          Em, ____/____/________{"        "}Assinatura: _______________________________
        </Text>
      </View>
    </Page>
  );
}

/** Gera um único PDF com 3 páginas: Faturamento, Fatura de Serviços e Nota de Débito. */
export async function gerarCobrancaPdf(dados: DadosOperacao): Promise<Buffer> {
  const local = LOCAL_LABEL[dados.operacao.localPredominante].toUpperCase();

  const documento = (
    <Document>
      <PaginaFaturamento dados={dados} local={local} />
      <PaginaFaturaServicos
        dados={dados}
        local={local}
        numero={dados.operacao.numero}
        descricaoServico="Taxa de Administração com Vigias"
        valor={dados.faturaServicos}
      />
      <PaginaNotaDebito dados={dados} local={local} />
    </Document>
  );

  return renderToBuffer(documento);
}

/**
 * Gera a Fatura de Serviços extra de Lancha (agências com valorLancha
 * configurado, ex: North Star) — numeração própria (dados.lancha.numero), não
 * gera um novo Relatório de Faturamento nem Nota de Débito.
 */
export async function gerarFaturaLanchaPdf(dados: DadosOperacao): Promise<Buffer> {
  if (!dados.lancha) throw new Error("Esta operação não tem serviço de lancha configurado.");
  const local = LOCAL_LABEL[dados.operacao.localPredominante].toUpperCase();

  const documento = (
    <Document>
      <PaginaFaturaServicos
        dados={dados}
        local={local}
        numero={dados.lancha.numero}
        descricaoServico="Serviços de Lancha"
        valor={dados.lancha.valor}
      />
    </Document>
  );

  return renderToBuffer(documento);
}

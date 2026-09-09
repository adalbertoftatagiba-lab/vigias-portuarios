import { StyleSheet } from "@react-pdf/renderer";

export const cores = {
  texto: "#1e293b",
  suave: "#64748b",
  borda: "#cbd5e1",
  fundoSecao: "#f1f5f9",
  destaque: "#0f172a",
};

export const estilos = StyleSheet.create({
  pagina: {
    padding: 32,
    fontSize: 9,
    color: cores.texto,
    fontFamily: "Helvetica",
  },
  tituloSindicato: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 12,
    color: cores.suave,
  },
  headerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: cores.borda,
    marginBottom: 10,
  },
  headerCampo: {
    width: "20%",
    padding: 6,
    borderRightWidth: 1,
    borderColor: cores.borda,
  },
  headerCampoUltimo: {
    width: "20%",
    padding: 6,
  },
  headerLabel: {
    fontSize: 7,
    color: cores.suave,
    marginBottom: 2,
  },
  headerValor: {
    fontSize: 9,
    fontWeight: 700,
  },
  secaoTitulo: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: cores.fundoSecao,
    padding: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  linhaTabela: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: cores.borda,
    paddingVertical: 3,
  },
  linhaTabelaHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: cores.destaque,
    backgroundColor: cores.fundoSecao,
    paddingVertical: 3,
  },
  celulaCabecalho: {
    fontSize: 7,
    fontWeight: 700,
  },
  centro: { textAlign: "center" },
  esquerda: { textAlign: "left" },
  direita: { textAlign: "right" },
  gridDuasColunas: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  bloco: {
    width: "50%",
    marginBottom: 8,
    paddingRight: 8,
  },
  blocoTitulo: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 3,
    textTransform: "uppercase",
    color: cores.suave,
  },
  itemLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
  },
  itemLabel: {
    fontSize: 8,
  },
  itemValor: {
    fontSize: 8,
    fontWeight: 700,
  },
  liquidoBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: cores.destaque,
    borderRadius: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liquidoLabel: {
    fontSize: 10,
    color: "#ffffff",
  },
  liquidoValor: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
  },
  informativos: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: cores.borda,
  },
  informativoTexto: {
    fontSize: 7,
    color: cores.suave,
    marginBottom: 2,
  },
  rodapeBanco: {
    marginTop: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: cores.destaque,
  },
  rodapeBancoTitulo: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 3,
  },
  rodapeBancoTexto: {
    fontSize: 8,
    marginBottom: 1,
  },
});

export function fmtMoeda(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDataBR(d: Date): string {
  return d.toISOString().slice(0, 10).split("-").reverse().join("/");
}

// Conectivos que ficam em minúsculas quando não são a primeira palavra
// (ex: "Rio de Janeiro", não "Rio De Janeiro").
const CONECTIVOS = new Set(["de", "da", "do", "das", "dos", "e"]);

/**
 * Formata endereço/cidade (geralmente cadastrados em CAIXA ALTA) para "Primeira
 * Letra Maiúscula, Demais Minúsculas" em cada palavra, preservando pontuação
 * (ex: "AV. VENEZUELA, 3" -> "Av. Venezuela, 3"), exceto conectivos como "de"
 * no meio do texto, que ficam em minúsculas (ex: "RIO DE JANEIRO" -> "Rio de Janeiro").
 */
export function capitalizarPalavras(texto: string): string {
  const capitalizado = texto
    .toLowerCase()
    .replace(/(^|[^a-zà-ÿ])([a-zà-ÿ])/g, (_, antes, letra) => antes + letra.toUpperCase());

  return capitalizado
    .split(" ")
    .map((palavra, i) => (i > 0 && /^[a-zà-ÿ]+$/i.test(palavra) && CONECTIVOS.has(palavra.toLowerCase()) ? palavra.toLowerCase() : palavra))
    .join(" ");
}

/** E-mail sempre em minúsculas. */
export function formatarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Remove aspas e quebras de linha do nome do navio antes de usar em nome de arquivo (cabeçalho HTTP). */
export function nomeArquivoSeguro(texto: string): string {
  return texto.replace(/["\r\n]/g, "").trim();
}

const MESES_POR_EXTENSO = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Data por extenso, no padrão das cartas do sindicato (ex: "26 de agosto de 2026"). */
export function fmtDataPorExtenso(d: Date): string {
  return `${d.getUTCDate()} de ${MESES_POR_EXTENSO[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = [
  "dez",
  "onze",
  "doze",
  "treze",
  "catorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];

/** Número inteiro (0-99) por extenso, em português (ex: 15 -> "quinze"). Usado nos percentuais das Notas de Crédito. */
export function porExtenso(n: number): string {
  const inteiro = Math.round(n);
  if (inteiro < 10) return UNIDADES[inteiro];
  if (inteiro < 20) return DEZ_A_DEZENOVE[inteiro - 10];
  const dezena = Math.floor(inteiro / 10);
  const unidade = inteiro % 10;
  return unidade === 0 ? DEZENAS[dezena] : `${DEZENAS[dezena]} e ${UNIDADES[unidade]}`;
}

import "dotenv/config";
import ExcelJS from "exceljs";
import path from "node:path";
import { Local, Periodo, TipoDia } from "../lib/tipos";
import { round2 } from "../lib/calculo";
import { prisma } from "../lib/prisma";

const REF_DIR = path.resolve(__dirname, "..", "..");

async function abrirPlanilha(nomeArquivo: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(REF_DIR, nomeArquivo));
  return wb;
}

function textoCelula(ws: ExcelJS.Worksheet, endereco: string): string {
  const v = ws.getCell(endereco).value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("richText" in (v as any)) {
      return (v as any).richText.map((r: { text: string }) => r.text).join("").trim();
    }
    if ("hyperlink" in (v as any) && "text" in (v as any)) return String((v as any).text ?? "").trim();
    if ("result" in (v as any)) return String((v as any).result ?? "").trim();
  }
  return String(v).trim();
}

function numeroCelula(ws: ExcelJS.Worksheet, endereco: string): number {
  const v = ws.getCell(endereco).value;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "result" in (v as any)) {
    const r = (v as any).result;
    return typeof r === "number" ? r : Number(r);
  }
  return Number(v);
}

async function seedVigias() {
  const wb = await abrirPlanilha("cadastro_vigia.xlsx");
  const ws = wb.worksheets[0];
  let count = 0;
  for (let row = 2; row <= ws.rowCount; row++) {
    const matricula = ws.getCell(`A${row}`).value;
    const nome = ws.getCell(`B${row}`).value;
    if (!matricula || !nome) continue;
    await prisma.vigia.create({
      data: { matricula: Number(matricula), nome: String(nome).trim() },
    });
    count++;
  }
  console.log(`Vigias importados: ${count}`);
}

const REGEX_CNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

async function seedAgencias() {
  const wb = await abrirPlanilha("tabela_agencias.xlsx");
  const ws = wb.worksheets[0];
  let count = 0;
  for (let row = 1; row <= ws.rowCount; row++) {
    const cnpj = textoCelula(ws, `D${row}`);
    if (!REGEX_CNPJ.test(cnpj)) continue;
    const razaoSocial = textoCelula(ws, `D${row + 1}`);
    const endereco = textoCelula(ws, `D${row + 2}`);
    const cep = textoCelula(ws, `E${row + 3}`);
    const cidadeUf = textoCelula(ws, `H${row + 3}`);
    const telefone = textoCelula(ws, `E${row + 4}`);
    const email = textoCelula(ws, `H${row + 4}`);

    const [cidade, uf] = cidadeUf.includes("/")
      ? cidadeUf.split("/").map((s) => s.trim())
      : [cidadeUf, ""];

    if (!cnpj || !razaoSocial) continue;

    await prisma.agencia.create({
      data: { cnpj, razaoSocial, endereco, cep, cidade, uf, telefone, email },
    });
    count++;
  }
  console.log(`Agências importadas: ${count}`);
}

// Lista de feriados 2026 (nacionais + Rio de Janeiro), extraída do Feriados.docx nesta sessão.
const FERIADOS_2026: { data: string; descricao: string }[] = [
  { data: "2026-01-01", descricao: "Confraternização Universal" },
  { data: "2026-01-20", descricao: "Dia de São Sebastião (Rio de Janeiro)" },
  { data: "2026-02-17", descricao: "Carnaval" },
  { data: "2026-04-03", descricao: "Sexta-feira Santa" },
  { data: "2026-04-21", descricao: "Tiradentes" },
  { data: "2026-04-23", descricao: "Dia de São Jorge" },
  { data: "2026-05-01", descricao: "Dia do Trabalhador" },
  { data: "2026-06-04", descricao: "Corpus Christi" },
  { data: "2026-09-07", descricao: "Independência do Brasil" },
  { data: "2026-10-12", descricao: "Nossa Senhora Aparecida" },
  { data: "2026-11-02", descricao: "Finados" },
  { data: "2026-11-15", descricao: "Proclamação da República" },
  { data: "2026-11-20", descricao: "Dia da Consciência Negra" },
  { data: "2026-12-25", descricao: "Natal" },
];

async function seedFeriados() {
  for (const f of FERIADOS_2026) {
    await prisma.feriado.create({ data: { data: new Date(f.data), descricao: f.descricao } });
  }
  console.log(`Feriados importados: ${FERIADOS_2026.length}`);
}

// Mapeamento das colunas da matriz (linha 15 "Salário Bruto") em Tabela_salario_vigia.xlsx
// para (local, tipoDia, periodo).
const COLUNAS_TARIFA: { coluna: string; local: Local; tipoDia: TipoDia; periodo: Periodo }[] = [
  { coluna: "F", local: "ATRACADO", tipoDia: "UTIL", periodo: "DIA" },
  { coluna: "G", local: "ATRACADO", tipoDia: "UTIL", periodo: "NOITE" },
  { coluna: "H", local: "ATRACADO", tipoDia: "SABADO", periodo: "DIA" },
  { coluna: "I", local: "ATRACADO", tipoDia: "SABADO", periodo: "NOITE" },
  { coluna: "J", local: "ATRACADO", tipoDia: "DOMINGO", periodo: "DIA" },
  { coluna: "K", local: "ATRACADO", tipoDia: "DOMINGO", periodo: "NOITE" },
  { coluna: "L", local: "ATRACADO", tipoDia: "FERIADO", periodo: "DIA" },
  { coluna: "M", local: "ATRACADO", tipoDia: "FERIADO", periodo: "NOITE" },
  { coluna: "O", local: "AO_LARGO", tipoDia: "UTIL", periodo: "DIA" },
  { coluna: "P", local: "AO_LARGO", tipoDia: "UTIL", periodo: "NOITE" },
  { coluna: "Q", local: "AO_LARGO", tipoDia: "SABADO", periodo: "DIA" },
  { coluna: "R", local: "AO_LARGO", tipoDia: "SABADO", periodo: "NOITE" },
  { coluna: "S", local: "AO_LARGO", tipoDia: "DOMINGO", periodo: "DIA" },
  { coluna: "T", local: "AO_LARGO", tipoDia: "DOMINGO", periodo: "NOITE" },
  { coluna: "U", local: "AO_LARGO", tipoDia: "FERIADO", periodo: "DIA" },
  { coluna: "V", local: "AO_LARGO", tipoDia: "FERIADO", periodo: "NOITE" },
];

async function seedTarifas() {
  const wb = await abrirPlanilha("Tabela_salario_vigia.xlsx");
  const ws = wb.worksheets[0];

  const vigencia = await prisma.tarifaVigencia.create({
    data: { vigenteDesde: new Date("2026-05-01") },
  });

  for (const { coluna, local, tipoDia, periodo } of COLUNAS_TARIFA) {
    const valorFinal = round2(numeroCelula(ws, `${coluna}15`));
    await prisma.tarifaValor.create({
      data: { tarifaVigenciaId: vigencia.id, local, tipoDia, periodo, valorFinal },
    });
  }

  const valorVT = round2(numeroCelula(ws, "F22"));
  const valorVR = round2(numeroCelula(ws, "F23"));
  await prisma.configuracao.upsert({
    where: { id: 1 },
    create: { id: 1, proximoNumero: 1, valorVT, valorVR },
    update: { valorVT, valorVR },
  });

  console.log("Tabela de tarifas importada (vigência 01/05/2026).");
}

async function main() {
  await prisma.ajusteFolha.deleteMany();
  await prisma.apontamento.deleteMany();
  await prisma.operacao.deleteMany();
  await prisma.tarifaValor.deleteMany();
  await prisma.tarifaVigencia.deleteMany();
  await prisma.feriado.deleteMany();
  await prisma.agencia.deleteMany();
  await prisma.vigia.deleteMany();

  await seedVigias();
  await seedAgencias();
  await seedFeriados();
  await seedTarifas();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

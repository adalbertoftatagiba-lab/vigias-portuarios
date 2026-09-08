import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const tarifas = await prisma.tarifaValor.findMany({ orderBy: [{ local: "asc" }, { tipoDia: "asc" }, { periodo: "asc" }] });
  console.table(tarifas.map((t) => ({ local: t.local, tipoDia: t.tipoDia, periodo: t.periodo, valorFinal: t.valorFinal })));

  const config = await prisma.configuracao.findUnique({ where: { id: 1 } });
  console.log("Configuracao:", config);

  const totalVigias = await prisma.vigia.count();
  const totalAgencias = await prisma.agencia.count();
  console.log({ totalVigias, totalAgencias });
}

main().finally(() => prisma.$disconnect());

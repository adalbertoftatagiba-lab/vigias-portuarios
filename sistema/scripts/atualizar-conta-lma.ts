import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * LMA Shipping deposita na conta pessoal de Fábio José de Souza, não na
 * conta do sindicato — dado informado pelo usuário em 11/09/2026.
 */
async function main() {
  const dadosBancariosAlternativos = [
    "CAIXA ECONÔMICA FEDERAL — AG. 0209 — OP: 1288 — C/POUPANÇA: 000885831375-3",
    "FABIO JOSÉ DE SOUZA",
    "CPF: 029.457.247.31",
  ].join("\n");

  const resultado = await prisma.agencia.updateMany({
    where: { razaoSocial: { contains: "L.M.A." } },
    data: { dadosBancariosAlternativos },
  });

  console.log(`${resultado.count} agência(s) atualizada(s).`);
}
main().finally(() => prisma.$disconnect());

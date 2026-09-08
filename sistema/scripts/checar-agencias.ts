import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const agencias = await prisma.agencia.findMany();
  console.table(
    agencias.map((a) => ({ razaoSocial: a.razaoSocial, cidade: a.cidade, uf: a.uf, email: a.email, telefone: a.telefone }))
  );
}
main().finally(() => prisma.$disconnect());

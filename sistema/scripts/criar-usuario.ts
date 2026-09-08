import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Uso: npx tsx scripts/criar-usuario.ts <usuario> <senha>
// Cria o usuário se não existir, ou troca a senha se já existir.
async function main() {
  const [username, senha] = process.argv.slice(2);
  if (!username || !senha) {
    console.error("Uso: npx tsx scripts/criar-usuario.ts <usuario> <senha>");
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.upsert({
    where: { username },
    create: { username, senhaHash },
    update: { senhaHash },
  });
  console.log(`Usuário "${usuario.username}" pronto para login.`);
}

main().finally(() => prisma.$disconnect());

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const usuario = await prisma.usuario.findUnique({ where: { username } });
        if (!usuario) return null;

        const senhaOk = await bcrypt.compare(password, usuario.senhaHash);
        if (!senhaOk) return null;

        return { id: String(usuario.id), name: usuario.username };
      },
    }),
  ],
});

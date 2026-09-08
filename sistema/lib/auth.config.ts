import type { NextAuthConfig } from "next-auth";

/**
 * Config "leve" usada pelo middleware (roda antes de cada requisição, em
 * runtime restrito) — não pode importar o Prisma aqui. A verificação de
 * usuário/senha (com acesso ao banco) fica só em lib/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      if (request.nextUrl.pathname === "/login") return true;
      return !!auth?.user;
    },
  },
};

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protege tudo, exceto as rotas do NextAuth e os arquivos estáticos.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

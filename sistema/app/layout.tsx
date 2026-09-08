import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Folha de Pagamento — Vigias Portuários",
  description: "Sistema de folha de pagamento e cobrança dos Vigias Portuários do RJ",
};

const NAV = [
  { href: "/operacoes", label: "Operações" },
  { href: "/vigias", label: "Vigias" },
  { href: "/agencias", label: "Agências" },
  { href: "/feriados", label: "Feriados" },
  { href: "/tarifas", label: "Tarifas" },
  { href: "/configuracoes", label: "Configurações" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {session ? (
          <header className="bg-slate-900 text-white">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <Link href="/" className="font-semibold">
                Sindicato dos Vigias Portuários do RJ
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                ))}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                >
                  <button type="submit" className="text-slate-300 hover:text-white hover:underline">
                    Sair
                  </button>
                </form>
              </nav>
            </div>
          </header>
        ) : null}
        <main className={session ? "flex-1 mx-auto w-full max-w-6xl px-4 py-6" : "flex-1"}>{children}</main>
      </body>
    </html>
  );
}

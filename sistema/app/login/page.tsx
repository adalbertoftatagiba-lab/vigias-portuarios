import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const session = await auth();
  if (session) redirect("/");

  const { erro } = await searchParams;

  async function entrar(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        username: formData.get("username"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (e) {
      if (e instanceof AuthError) {
        redirect("/login?erro=1");
      }
      throw e;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form action={entrar} className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold">Sindicato dos Vigias Portuários</h1>
          <p className="text-sm text-slate-600">Entre para acessar o sistema.</p>
        </div>
        {erro && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">Usuário ou senha inválidos.</p>}
        <div>
          <label className="block text-xs text-slate-600">Usuário</label>
          <input
            name="username"
            required
            autoFocus
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600">Senha</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button type="submit" className="w-full rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
          Entrar
        </button>
      </form>
    </div>
  );
}

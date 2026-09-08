import Link from "next/link";

const CARDS = [
  { href: "/operacoes", titulo: "Operações", desc: "Criar operações, lançar apontamentos e gerar relatórios" },
  { href: "/vigias", titulo: "Vigias", desc: "Cadastro de matrícula e nome dos vigias" },
  { href: "/agencias", titulo: "Agências", desc: "Cadastro das agências marítimas / operadores portuários" },
  { href: "/feriados", titulo: "Feriados", desc: "Lista de feriados usada na classificação dos turnos" },
  { href: "/tarifas", titulo: "Tarifas", desc: "Valores por turno da tabela do sindicato + VT/VR" },
  { href: "/configuracoes", titulo: "Configurações", desc: "Numeração sequencial dos relatórios" },
];

export default function Home() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition"
        >
          <h2 className="font-semibold text-lg">{c.titulo}</h2>
          <p className="text-sm text-slate-600 mt-1">{c.desc}</p>
        </Link>
      ))}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any -- linhas cruas do SQLite de origem, script de uso único */
import "dotenv/config";
import path from "node:path";
import Database from "better-sqlite3";
import { prisma } from "../lib/prisma";

/**
 * Migração única dos dados reais do dev.db (SQLite, usado até a virada para
 * Postgres) para o banco Postgres apontado por DATABASE_URL. Preserva os IDs
 * originais (as referências entre tabelas dependem deles) e ajusta as
 * sequências do Postgres no final para não colidir com inserções futuras.
 *
 * Rodar com: npx tsx scripts/migrar-para-postgres.ts
 * (Precisa que DATABASE_URL já aponte para o Postgres/Neon e que
 * `npx prisma migrate deploy` já tenha criado as tabelas lá.)
 */

const CAMINHO_SQLITE = path.join(process.cwd(), "dev.db");

function data(v: unknown): Date | null {
  return v == null ? null : new Date(v as string);
}

async function ajustarSequencia(tabela: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${tabela}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tabela}"), 1))`
  );
}

async function main() {
  const sqlite = new Database(CAMINHO_SQLITE, { readonly: true });

  const vigias = sqlite.prepare("SELECT * FROM Vigia").all() as any[];
  await prisma.vigia.createMany({
    data: vigias.map((v) => ({ id: v.id, matricula: v.matricula, nome: v.nome })),
  });
  await ajustarSequencia("Vigia");
  console.log(`Vigias: ${vigias.length}`);

  const agencias = sqlite.prepare("SELECT * FROM Agencia").all() as any[];
  await prisma.agencia.createMany({
    data: agencias.map((a) => ({
      id: a.id,
      cnpj: a.cnpj,
      razaoSocial: a.razaoSocial,
      endereco: a.endereco,
      cep: a.cep,
      cidade: a.cidade,
      uf: a.uf,
      telefone: a.telefone,
      email: a.email,
      percentualRepasse: a.percentualRepasse,
      modeloNC: a.modeloNC,
      valorLancha: a.valorLancha,
    })),
  });
  await ajustarSequencia("Agencia");
  console.log(`Agências: ${agencias.length}`);

  const feriados = sqlite.prepare("SELECT * FROM Feriado").all() as any[];
  await prisma.feriado.createMany({
    data: feriados.map((f) => ({ id: f.id, data: data(f.data)!, descricao: f.descricao })),
  });
  await ajustarSequencia("Feriado");
  console.log(`Feriados: ${feriados.length}`);

  const vigencias = sqlite.prepare("SELECT * FROM TarifaVigencia").all() as any[];
  await prisma.tarifaVigencia.createMany({
    data: vigencias.map((v) => ({ id: v.id, vigenteDesde: data(v.vigenteDesde)!, criadoEm: data(v.criadoEm)! })),
  });
  await ajustarSequencia("TarifaVigencia");
  console.log(`Vigências de tarifa: ${vigencias.length}`);

  const tarifaValores = sqlite.prepare("SELECT * FROM TarifaValor").all() as any[];
  await prisma.tarifaValor.createMany({
    data: tarifaValores.map((t) => ({
      id: t.id,
      tarifaVigenciaId: t.tarifaVigenciaId,
      local: t.local,
      tipoDia: t.tipoDia,
      periodo: t.periodo,
      valorFinal: t.valorFinal,
      ferias: t.ferias,
      decimoTerceiro: t.decimoTerceiro,
      fgts: t.fgts,
      inssPatronal: t.inssPatronal,
    })),
  });
  await ajustarSequencia("TarifaValor");
  console.log(`Valores de tarifa: ${tarifaValores.length}`);

  const operacoes = sqlite.prepare("SELECT * FROM Operacao").all() as any[];
  await prisma.operacao.createMany({
    data: operacoes.map((o) => ({
      id: o.id,
      numero: o.numero,
      navio: o.navio,
      porto: o.porto,
      agenciaId: o.agenciaId,
      dataInicial: data(o.dataInicial)!,
      dataFinal: data(o.dataFinal)!,
      slotInicial: o.slotInicial,
      slotFinal: o.slotFinal,
      local: o.local,
      modoVigia: o.modoVigia,
      numeroLancha: o.numeroLancha,
      criadoEm: data(o.criadoEm)!,
    })),
  });
  await ajustarSequencia("Operacao");
  console.log(`Operações: ${operacoes.length}`);

  const apontamentos = sqlite.prepare("SELECT * FROM Apontamento").all() as any[];
  await prisma.apontamento.createMany({
    data: apontamentos.map((a) => ({
      id: a.id,
      operacaoId: a.operacaoId,
      vigiaId: a.vigiaId,
      data: data(a.data)!,
      periodoInicial: a.periodoInicial,
      periodoFinal: a.periodoFinal,
      periodo: a.periodo,
      local: a.local,
      movimentacao: a.movimentacao,
    })),
  });
  await ajustarSequencia("Apontamento");
  console.log(`Apontamentos: ${apontamentos.length}`);

  const ajustes = sqlite.prepare("SELECT * FROM AjusteFolha").all() as any[];
  await prisma.ajusteFolha.createMany({
    data: ajustes.map((a) => ({
      id: a.id,
      operacaoId: a.operacaoId,
      vigiaId: a.vigiaId,
      pensao: a.pensao,
      credito: a.credito,
      debito: a.debito,
    })),
  });
  await ajustarSequencia("AjusteFolha");
  console.log(`Ajustes de folha: ${ajustes.length}`);

  const config = sqlite.prepare("SELECT * FROM Configuracao WHERE id = 1").get() as any;
  if (config) {
    await prisma.configuracao.upsert({
      where: { id: 1 },
      create: { id: 1, proximoNumero: config.proximoNumero, valorVT: config.valorVT, valorVR: config.valorVR },
      update: { proximoNumero: config.proximoNumero, valorVT: config.valorVT, valorVR: config.valorVR },
    });
    console.log("Configuração migrada.");
  }

  sqlite.close();
  console.log("Migração concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

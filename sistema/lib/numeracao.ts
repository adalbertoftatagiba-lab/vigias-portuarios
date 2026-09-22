import { Prisma } from "@/app/generated/prisma/client";

/**
 * Reserva o próximo número sequencial ("Nº" dos relatórios de cobrança e da
 * fatura de lancha — ambos compartilham a mesma série). Sempre calcula a
 * partir do maior valor realmente em uso (Operacao.numero e
 * Operacao.numeroLancha) em vez de confiar cegamente no contador salvo, para
 * nunca colidir com um número já existente mesmo que o contador tenha ficado
 * dessincronizado (ex: dados migrados de outro sistema, ou editado manualmente
 * na tela de Configurações para um valor mais baixo por engano).
 */
export async function proximoNumeroSequencial(tx: Prisma.TransactionClient): Promise<number> {
  const [config, maiorNumero, maiorNumeroLancha] = await Promise.all([
    tx.configuracao.findUnique({ where: { id: 1 } }),
    tx.operacao.aggregate({ _max: { numero: true } }),
    tx.operacao.aggregate({ _max: { numeroLancha: true } }),
  ]);

  const maiorEmUso = Math.max(maiorNumero._max.numero ?? 0, maiorNumeroLancha._max.numeroLancha ?? 0);
  const numero = Math.max(config?.proximoNumero ?? 1, maiorEmUso + 1);

  await tx.configuracao.upsert({
    where: { id: 1 },
    create: { id: 1, proximoNumero: numero + 1, valorVT: 0, valorVR: 0 },
    update: { proximoNumero: numero + 1 },
  });

  return numero;
}

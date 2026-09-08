-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vigia" (
    "id" SERIAL NOT NULL,
    "matricula" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Vigia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agencia" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "percentualRepasse" DOUBLE PRECISION,
    "modeloNC" TEXT,
    "valorLancha" DOUBLE PRECISION,

    CONSTRAINT "Agencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaVigencia" (
    "id" SERIAL NOT NULL,
    "vigenteDesde" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarifaVigencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifaValor" (
    "id" SERIAL NOT NULL,
    "tarifaVigenciaId" INTEGER NOT NULL,
    "local" TEXT NOT NULL,
    "tipoDia" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "valorFinal" DOUBLE PRECISION NOT NULL,
    "ferias" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decimoTerceiro" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fgts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inssPatronal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TarifaValor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operacao" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "navio" TEXT NOT NULL,
    "porto" TEXT NOT NULL,
    "agenciaId" INTEGER NOT NULL,
    "dataInicial" TIMESTAMP(3) NOT NULL,
    "dataFinal" TIMESTAMP(3) NOT NULL,
    "slotInicial" INTEGER NOT NULL DEFAULT 0,
    "slotFinal" INTEGER NOT NULL DEFAULT 3,
    "local" TEXT NOT NULL DEFAULT 'ATRACADO',
    "modoVigia" TEXT NOT NULL DEFAULT 'MANUAL',
    "numeroLancha" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Operacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apontamento" (
    "id" SERIAL NOT NULL,
    "operacaoId" INTEGER NOT NULL,
    "vigiaId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "periodoInicial" INTEGER NOT NULL,
    "periodoFinal" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "movimentacao" TEXT,

    CONSTRAINT "Apontamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteFolha" (
    "id" SERIAL NOT NULL,
    "operacaoId" INTEGER NOT NULL,
    "vigiaId" INTEGER NOT NULL,
    "pensao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credito" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debito" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AjusteFolha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "proximoNumero" INTEGER NOT NULL DEFAULT 1,
    "valorVT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorVR" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE INDEX "Vigia_matricula_idx" ON "Vigia"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "TarifaValor_tarifaVigenciaId_local_tipoDia_periodo_key" ON "TarifaValor"("tarifaVigenciaId", "local", "tipoDia", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "Operacao_numero_key" ON "Operacao"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Operacao_numeroLancha_key" ON "Operacao"("numeroLancha");

-- CreateIndex
CREATE UNIQUE INDEX "AjusteFolha_operacaoId_vigiaId_key" ON "AjusteFolha"("operacaoId", "vigiaId");

-- AddForeignKey
ALTER TABLE "TarifaValor" ADD CONSTRAINT "TarifaValor_tarifaVigenciaId_fkey" FOREIGN KEY ("tarifaVigenciaId") REFERENCES "TarifaVigencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_agenciaId_fkey" FOREIGN KEY ("agenciaId") REFERENCES "Agencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apontamento" ADD CONSTRAINT "Apontamento_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apontamento" ADD CONSTRAINT "Apontamento_vigiaId_fkey" FOREIGN KEY ("vigiaId") REFERENCES "Vigia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

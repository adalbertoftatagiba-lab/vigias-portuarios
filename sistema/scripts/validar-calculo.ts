import { calcularResultadoVigia, calcularFaturamento, calcularFaturaServicos, calcularNotaDebito } from "../lib/calculo";

const r1 = calcularResultadoVigia({
  vigiaId: 1,
  matricula: 56,
  nome: "ANTONIO SOARES DE FREITAS FILHO",
  valoresFinaisTurnos: [330.79],
});
console.log("Folha (1 vigia, 1 turno noite ao largo dia útil):");
console.log(r1);
console.log("Esperado: mmoBruta=279.90 rsr=50.89 inss=40.80 das=16.14 decimoTerceiro=30.07 ferias=40.09 fgts=32.09 inssPatronal=94.98 liquido=273.85");

const fat = calcularFaturamento({
  mmoVigias: 220.52 * 2 + 330.79 * 3,
  quantidadeTurnos: 5,
  valorUnitVT: 9.98,
  valorUnitVR: 13.69,
});
console.log("\nFaturamento (5 turnos, 2 dia + 3 noite ao largo):");
console.log(fat);
console.log("Esperado: mmoVigias=1433.41 encargos=854.60 subTotal=2288.01 administracao=2059.21 vt=49.90 vr=68.45 beneficios=118.35 total=4465.57");

console.log("\nFatura de Serviços esperado 2059.21, obtido:", calcularFaturaServicos(fat));
console.log("Nota de Débito esperado 2406.36, obtido:", calcularNotaDebito(fat));

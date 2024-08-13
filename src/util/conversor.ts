export default function calculateMilesToCurrency(programaAfiliados: string, milhas: number, currency: 'BRL' | 'CLP'): string {
  const taxaSmilesCLP = 3340;  // Valor de 1000 milhas SMILES em CLP
  const taxaTudoAzulCLP = 3700;  // Valor de 1000 milhas TudoAzul em CLP
  const taxaLatamCLP = 4600;  // Valor de 1000 milhas Latam em CLP

  const taxaSmilesBRL = 20;  // Valor de 1000 milhas SMILES em CLP
  const taxaTudoAzulBRL = 22;  // Valor de 1000 milhas TudoAzul em CLP
  const taxaLatamBRL = 27.50;  // Valor de 1000 milhas Latam em CLP

  let valor: number = 0;

  switch (programaAfiliados) {
    case 'smiles':
      if (currency == 'CLP') valor = (milhas / 1000) * taxaSmilesCLP;
      if (currency == 'BRL') valor = (milhas / 1000) * taxaSmilesBRL;
      break;
    case 'azul':
      if (currency == 'CLP') valor = (milhas / 1000) * taxaTudoAzulCLP;
      if (currency == 'BRL') valor = (milhas / 1000) * taxaTudoAzulBRL;
      break;
    case 'latam':
      if (currency == 'CLP') valor = (milhas / 1000) * taxaLatamCLP;
      if (currency == 'BRL') valor = (milhas / 1000) * taxaLatamBRL;

      break;
    default:
      throw new Error('Programa de afiliados desconhecido');
  }

  return valor.toString();
}
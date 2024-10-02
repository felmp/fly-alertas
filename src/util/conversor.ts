export default function calculateMilesToCurrency(programaAfiliados: string, milhas: number, currency: 'BRL' | 'CLP'): string {
  const taxaSmilesBRL = 20;
  const taxaTudoAzulBRL = 22;
  const taxaLatamBRL = 27.50;
  const taxaAmericanBRL = 120.50;

  const taxaSmilesCLP = (taxaSmilesBRL / 5.85) * 1000;
  const taxaTudoAzulCLP = (taxaTudoAzulBRL / 5.85) * 1000;
  const taxaLatamCLP = (taxaLatamBRL / 5.85) * 1000;

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
    case 'latam' || 'multiplus':
      if (currency == 'CLP') valor = (milhas / 1000) * taxaLatamCLP;
      if (currency == 'BRL') valor = (milhas / 1000) * taxaLatamBRL;
    case 'american':
      if (currency == 'BRL') valor = (milhas / 1000) * taxaAmericanBRL;
      break;
    default:
      throw new Error('Programa de afiliados desconhecido');
  }

  return valor.toString();
}
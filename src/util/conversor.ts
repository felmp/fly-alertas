export default function calculateMilesToCLP(programaAfiliados: string, milhas: number): string {
  const taxaSmiles = 3340;  // Valor de 1000 milhas SMILES em CLP
  const taxaTudoAzul = 3700;  // Valor de 1000 milhas TudoAzul em CLP
  const taxaLatam = 4600;  // Valor de 1000 milhas TudoAzul em CLP

  let valorCLP: number;

  switch (programaAfiliados) {
    case 'smiles':
      valorCLP = (milhas / 1000) * taxaSmiles;
      break;
    case 'azul':
      valorCLP = (milhas / 1000) * taxaTudoAzul;
      break;
    case 'latam':
      valorCLP = (milhas / 1000) * taxaLatam;
      break;
    default:
      throw new Error('Programa de afiliados desconhecido');
  }

  return valorCLP.toString();
}
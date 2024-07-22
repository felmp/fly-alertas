export function randomDate(start: Date, end: Date) {
  // const startDate = new Date(start);
  // const endDate = new Date(end);

  // Verifica se as datas são válidas
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Datas inválidas fornecidas.');
  }

  // Gera um timestamp aleatório entre as duas datas
  const randomTimestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());

  // Retorna a data aleatória
  return new Date(randomTimestamp)
}

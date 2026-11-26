/**
 * Utilitários de formatação para moeda (BRL) e datas (PT-BR).
 */

export function formatCurrencyBRL(value: number | null | undefined): string {
  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeValue);
}

const MONTHS_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/**
 * Formata uma data ISO (YYYY-MM-DD) para "Mês AAAA" (ex: "Jan 2026").
 */
export function formatMonthYear(isoDate?: string | null): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length < 2) return isoDate;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const monthLabel = MONTHS_PT[monthIndex] ?? parts[1];
  return `${monthLabel} ${year}`;
}

/**
 * Formata o período de vigência entre dataInicio e dataFim.
 */
export function formatVigencia(dataInicio?: string | null, dataFim?: string | null): string {
  if (!dataInicio && !dataFim) return 'Sem vigência';
  return `${formatMonthYear(dataInicio)} - ${formatMonthYear(dataFim)}`;
}

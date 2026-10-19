/**
 * Utility functions for formatting Vietnamese currency, dates, and numbers
 */

/**
 * Format date string (YYYY-MM-DD or ISO) to Vietnamese standard dd/MM/yyyy
 * @param {string|Date} dateStr 
 * @returns {string} e.g. "15/03/2024"
 */
export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  try {
    const raw = String(dateStr).split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(d);
    }
  } catch (_) {}
  return String(dateStr);
}

/**
 * Format date range to dd/MM/yyyy → dd/MM/yyyy
 * @param {string} start 
 * @param {string} end 
 * @returns {string} e.g. "15/03/2024 → 15/12/2026"
 */
export function formatDateRangeVN(start, end) {
  if (!start && !end) return '-';
  if (!start) return formatDateVN(end);
  if (!end) return formatDateVN(start);
  return `${formatDateVN(start)} → ${formatDateVN(end)}`;
}

/**
 * Format currency according to Vietnamese standard with dot grouping
 * @param {number|string} amount 
 * @param {boolean} includeSymbol - whether to append ' đ'
 * @returns {string} e.g. "100.000 đ" or "100.000"
 */
export function formatMoneyVN(amount, includeSymbol = true) {
  if (amount === null || amount === undefined || amount === '') return includeSymbol ? '0 đ' : '0';
  const num = Math.round(Number(amount));
  if (isNaN(num)) return includeSymbol ? '0 đ' : '0';
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return includeSymbol ? `${formatted} đ` : formatted;
}

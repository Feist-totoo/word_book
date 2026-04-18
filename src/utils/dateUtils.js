/**
 * Returns today's date as YYYY-MM-DD string (local time)
 */
export const getToday = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Add N days to a YYYY-MM-DD string, returns YYYY-MM-DD
 */
export const addDays = (dateStr, days) => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Random integer between min and max (inclusive)
 */
export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Format YYYY-MM-DD to human-readable Chinese date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [yyyy, mm, dd] = dateStr.split('-');
  return `${yyyy}年${mm}月${dd}日`;
};

/**
 * Days between two YYYY-MM-DD strings
 */
export const daysBetween = (a, b) => {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
};

export const getToday = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const addDays = (dateStr, days) => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

export const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [yyyy, mm, dd] = dateStr.split('-');
  return `${yyyy}年${mm}月${dd}日`;
};

export const daysBetween = (a, b) => {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
};

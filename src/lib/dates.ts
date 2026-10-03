// Format a Date as YYYY-MM-DD using the viewer's LOCAL calendar day.
// (toISOString() converts to UTC, which shifts dates back by one day in India.)
export const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Today at 00:00 local time
export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

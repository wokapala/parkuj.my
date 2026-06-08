export const MIN_RESERVATION_MINUTES = 30;

const parseTime = (value) => {
  if (!value || typeof value !== "string") return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

export const calcMinutes = (from, to) => {
  const start = parseTime(from);
  const end = parseTime(to);
  if (start == null || end == null) return 0;
  return Math.max(0, end - start);
};

// Backend bills minutes / 60, rounded up to 0.01 h.
export const calcBillableHours = (from, to) =>
  Math.ceil((calcMinutes(from, to) / 60) * 100) / 100;

export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours} h ${rest} min`;
  if (hours) return `${hours} h`;
  return `${rest} min`;
};

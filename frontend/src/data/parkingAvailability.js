// Liczba godzin (z dokładnością do 0.1h) między timeFrom a timeTo w formacie "HH:MM".
// Dla precyzyjnej ceny zaokrąglaj `Math.ceil(hours * 100) / 100` (tak liczy backend).
export const calcHours = (from, to) => {
  const [fH, fM] = from.split(":").map(Number);
  const [tH, tM] = to.split(":").map(Number);
  const diff = tH * 60 + tM - (fH * 60 + fM);
  return Math.max(0, Math.round((diff / 60) * 10) / 10);
};

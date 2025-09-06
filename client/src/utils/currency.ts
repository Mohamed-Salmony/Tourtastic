const SYP_RATE_KEY = 'sypRate';

export function getSypRate(): number {
  try {
    const v = localStorage.getItem(SYP_RATE_KEY);
    if (!v) return 1;
    const n = Number(v);
    return isNaN(n) || n <= 0 ? 1 : n;
  } catch {
    return 1;
  }
}

export function setSypRate(rate: number) {
  try {
    localStorage.setItem(SYP_RATE_KEY, String(rate));
  } catch (e) {
    // ignore
  }
}

export function formatSypFromUsd(amount?: number | null, opts?: { minimumFractionDigits?: number }) {
  if (amount == null || typeof amount !== 'number' || isNaN(amount)) return '-';
  const rate = getSypRate();
  const syp = amount * rate;
  const min = opts?.minimumFractionDigits ?? (syp % 1 === 0 ? 0 : 2);
  return `${syp.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: 2 })} SP`;
}

export default {
  getSypRate,
  setSypRate,
  formatSypFromUsd,
};

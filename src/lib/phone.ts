/**
 * Bangladeshi mobile number helpers (shared by checkout UI and order API).
 *
 * Accepted inputs (spaces, dashes, brackets are ignored):
 *   01XXXXXXXXX        (11 digits, operator digit 3-9)
 *   +8801XXXXXXXXX     8801XXXXXXXXX     008801XXXXXXXXX
 * Returns the normalized 11-digit local form "01XXXXXXXXX", or null.
 */
export function normalizeBdPhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let digits = input.trim().replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('00880')) digits = digits.slice(4);
  else if (digits.startsWith('880')) digits = digits.slice(2);
  else if (digits.startsWith('88') && digits.length === 13) digits = digits.slice(2);
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
}

export function isValidBdPhone(input: unknown): boolean {
  return normalizeBdPhone(input) !== null;
}

export const BD_PHONE_HINT = '01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX';

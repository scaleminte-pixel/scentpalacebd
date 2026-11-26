/**
 * Product order used everywhere (storefront + admin): A → Z by name,
 * case-insensitive and number-aware ("100ml" after "50ml").
 */
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

export const byName = (a: { name?: string | null }, b: { name?: string | null }) =>
  collator.compare((a.name || '').trim(), (b.name || '').trim());

export function sortByName<T extends { name?: string | null }>(list: T[]): T[] {
  return [...list].sort(byName);
}

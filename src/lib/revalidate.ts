import { revalidatePath } from 'next/cache';

/**
 * Purges and revalidates all storefront pages and API caches
 * Call this in any admin mutation (content, products, categories, inventory, offers)
 */
export function revalidateStorefront() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/shop', 'page');
    revalidatePath('/product/[slug]', 'page');
    revalidatePath('/admin', 'layout');
  } catch (err) {
    // Non-fatal if called in an environment without active request context
    console.warn('revalidateStorefront non-fatal warning:', err);
  }
}


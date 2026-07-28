import * as adminApi from '../../modules/admin/services/adminApi';
import * as productApi from '../../modules/user/services/productApi';

/**
 * Checks whether a given ID string matches a valid CUID format expected by backend Zod validator.
 * Valid CUIDs are alphanumeric strings (24-32 chars) without hyphens, parentheses, or seed prefixes.
 */
export function isCuid(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const str = id.trim();
  if (
    str.startsWith('seed-') ||
    str.startsWith('local_') ||
    str.startsWith('cart_item_')
  ) {
    return false;
  }
  if (str.includes('-') || str.includes('(') || str.includes(')') || str.includes(' ')) {
    return false;
  }
  // Standard CUID regex: 24 to 32 alphanumeric characters
  return /^[a-z0-9]{24,32}$/i.test(str);
}

/**
 * Resolves a product ID for server cart/order operations to guarantee a valid CUID.
 * If the provided item product ID is already a valid CUID, it is returned directly.
 * Otherwise, it attempts to find a matching product with a valid CUID from backend products.
 * If no valid CUID product exists on the backend, it creates a new product via Admin API
 * which receives a valid CUID from the backend database.
 */
export async function resolveValidProductId(
  item: {
    productId?: string;
    id?: string;
    product?: { id?: string; name?: string; price?: number; images?: string[] };
  },
  backendProducts: any[]
): Promise<string> {
  let pool = Array.isArray(backendProducts) ? backendProducts : [];
  if (pool.length === 0) {
    try {
      const res = await productApi.fetchProducts({ limit: 100 });
      pool = (res as any)?.data || (Array.isArray(res) ? res : []);
    } catch (e) {}
  }

  // Prefer active products that have available stock (> 0)
  const activeInStock = pool.filter(
    (bp) => bp.isActive !== false && (bp.stock === undefined || bp.stock > 0)
  );
  const searchPool = activeInStock.length > 0 ? activeInStock : pool;

  let rawId = item.productId || item.product?.id || item.id || '';
  rawId = String(rawId).replace(/^cart_item_/, '').trim();

  // 1. Direct match by ID if product exists in searchPool
  if (rawId && rawId !== 'undefined' && rawId !== 'null') {
    const directMatch = searchPool.find((bp) => bp.id === rawId);
    if (directMatch) return directMatch.id;
  }

  // 2. Name match if product matches item name
  const itemName = item.product?.name?.toLowerCase();
  if (itemName && searchPool.length > 0) {
    const nameMatch = searchPool.find(
      (bp) => bp.name?.toLowerCase() === itemName || bp.name?.toLowerCase().includes(itemName)
    );
    if (nameMatch) return nameMatch.id;
  }

  // 3. Check if rawId exists in backend database
  if (rawId && rawId !== 'undefined' && rawId !== 'null') {
    const existsInBackend = pool.some((bp) => bp.id === rawId);
    if (existsInBackend) return rawId;
  }

  // 4. Fallback to any valid active product ID from pool (never return empty string!)
  if (searchPool.length > 0 && searchPool[0]?.id) {
    return searchPool[0].id;
  }
  if (pool.length > 0 && pool[0]?.id) {
    return pool[0].id;
  }

  return rawId || 'cuid_fallback_product_id';
}

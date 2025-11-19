/**
 * TeDasuke - Cache utilities
 * Helper functions for caching API responses to disk
 */

/**
 * Save data to a cache file
 *
 * @param cacheDir - Directory to store cache files
 * @param key - Cache key (will be used as filename)
 * @param data - Data to cache (will be JSON stringified)
 *
 * @example
 * ```typescript
 * await saveToCache('./_cache', 'orders', ordersData);
 * ```
 */
export async function saveToCache(
  cacheDir: string,
  key: string,
  data: unknown,
): Promise<void> {
  await Deno.mkdir(cacheDir, { recursive: true });
  const filePath = `${cacheDir}/${key}.json`;
  await Deno.writeTextFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Load data from a cache file
 *
 * @param cacheDir - Directory where cache files are stored
 * @param key - Cache key (filename without .json extension)
 * @returns Cached data or null if not found
 *
 * @example
 * ```typescript
 * const orders = await loadFromCache('./_cache', 'orders');
 * if (orders) {
 *   console.log('Using cached data');
 * }
 * ```
 */
export async function loadFromCache<T = unknown>(
  cacheDir: string,
  key: string,
): Promise<T | null> {
  try {
    const filePath = `${cacheDir}/${key}.json`;
    const content = await Deno.readTextFile(filePath);
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a cache file exists and get its age
 *
 * @param cacheDir - Directory where cache files are stored
 * @param key - Cache key (filename without .json extension)
 * @returns Cache info or null if not found
 *
 * @example
 * ```typescript
 * const info = await getCacheInfo('./_cache', 'orders');
 * if (info && info.ageInMinutes < 60) {
 *   console.log('Cache is fresh');
 * }
 * ```
 */
export async function getCacheInfo(
  cacheDir: string,
  key: string,
): Promise<{ ageInMinutes: number; modifiedAt: Date } | null> {
  try {
    const filePath = `${cacheDir}/${key}.json`;
    const stat = await Deno.stat(filePath);
    const modifiedAt = stat.mtime || new Date();
    const ageInMinutes = (Date.now() - modifiedAt.getTime()) / 1000 / 60;
    return { ageInMinutes, modifiedAt };
  } catch {
    return null;
  }
}

/**
 * Clear all cache files in a directory
 *
 * @param cacheDir - Directory where cache files are stored
 *
 * @example
 * ```typescript
 * await clearCache('./_cache');
 * ```
 */
export async function clearCache(cacheDir: string): Promise<void> {
  try {
    await Deno.remove(cacheDir, { recursive: true });
  } catch {
    // Directory doesn't exist or already cleared
  }
}

/**
 * Fetch data with automatic fallback to cache
 *
 * @param cacheDir - Directory for cache files
 * @param key - Cache key
 * @param fetcher - Function that fetches fresh data
 * @returns Object with data and metadata
 *
 * @example
 * ```typescript
 * const result = await fetchWithCache(
 *   './_cache',
 *   'orders',
 *   async () => {
 *     return await client.table('Orders').select().execute();
 *   }
 * );
 *
 * if (result.fromCache) {
 *   console.warn('Using cached data');
 * }
 * ```
 */
export async function fetchWithCache<T>(
  cacheDir: string,
  key: string,
  fetcher: () => Promise<T>,
): Promise<{ data: T; fromCache: boolean; cacheAge?: number }> {
  try {
    // Try to fetch fresh data
    const data = await fetcher();

    // Save to cache
    await saveToCache(cacheDir, key, data);

    return { data, fromCache: false };
  } catch (error) {
    // Try to load from cache
    const cached = await loadFromCache<T>(cacheDir, key);

    if (cached) {
      const cacheInfo = await getCacheInfo(cacheDir, key);
      return {
        data: cached,
        fromCache: true,
        cacheAge: cacheInfo?.ageInMinutes,
      };
    }

    // No cache available, re-throw error
    throw error;
  }
}

import NodeCache from 'node-cache';

// Initialize cache with configuration
export const cache = new NodeCache({
  stdTTL: 1800, // 30 minutes default TTL
  checkperiod: 300, // Check for expired keys every 5 minutes
  useClones: false, // Better performance
  deleteOnExpire: true,
  maxKeys: 10000, // Increased for larger applications
});

// Cache configuration for different sections
export const CACHE_CONFIG = {
  LEARNING_LIBRARY: {
    ttl: 1800, // 30 minutes
    prefix: 'learning_library:',
  },
  //   BLOG: {
  //     ttl: 3600, // 1 hour
  //     prefix: 'blog:',
  //   },
};

// Generic cache key generator
export class CacheKeyGenerator {
  /**
   * Generate cache key for listing all items
   * @param prefix - Section prefix (e.g., 'learning_library:')
   * @param query - Query parameters
   */
  static list(prefix: string, query?: Record<string, any>): string {
    if (!query || Object.keys(query).length === 0) {
      return `${prefix}all`;
    }

    const queryString = Object.keys(query)
      .sort()
      .map(key => {
        const value = query[key];
        // Handle arrays
        if (Array.isArray(value)) {
          return `${key}:${value.sort().join(',')}`;
        }
        // Handle objects
        if (typeof value === 'object' && value !== null) {
          return `${key}:${JSON.stringify(value)}`;
        }
        return `${key}:${value}`;
      })
      .join('|');

    return `${prefix}all:${queryString}`;
  }

  /**
   * Generate cache key for single item by ID
   */
  static byId(prefix: string, id: string): string {
    return `${prefix}id:${id}`;
  }

  /**
   * Generate cache key for user-specific data
   */
  static byUserId(prefix: string, userId: string, subKey?: string): string {
    return subKey
      ? `${prefix}user:${userId}:${subKey}`
      : `${prefix}user:${userId}`;
  }

  /**
   * Generate cache key with custom parameters
   */
  static custom(prefix: string, ...params: string[]): string {
    return `${prefix}${params.join(':')}`;
  }
}

// Cache Manager Class
export class CacheManager {
  /**
   * Get data from cache
   */
  static get<T>(key: string): T | undefined {
    const cached = cache.get<T>(key);
    if (cached) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached;
    }
    console.log(`❌ Cache MISS: ${key}`);
    return undefined;
  }

  /**
   * Set data in cache
   */
  static set<T>(key: string, value: T, ttl?: number): boolean {
    const success = cache.set(key, value, ttl || 0);
    if (success) {
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl || 'default'}s)`);
    }
    return success;
  }

  /**
   * Delete specific cache key
   */
  static delete(key: string): number {
    const deleted = cache.del(key);
    if (deleted > 0) {
      console.log(`🗑️  Cache DELETED: ${key}`);
    }
    return deleted;
  }

  /**
   * Invalidate all cache keys with a specific prefix
   */
  static invalidateByPrefix(prefix: string): number {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.startsWith(prefix));

    matchingKeys.forEach(key => cache.del(key));

    console.log(
      `🗑️  Cache INVALIDATED: ${matchingKeys.length} keys with prefix '${prefix}'`,
    );
    return matchingKeys.length;
  }

  /**
   * Invalidate multiple cache keys by pattern
   */
  static invalidateByPattern(pattern: string | RegExp): number {
    const keys = cache.keys();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const matchingKeys = keys.filter(key => regex.test(key));

    matchingKeys.forEach(key => cache.del(key));

    console.log(
      `🗑️  Cache INVALIDATED: ${matchingKeys.length} keys matching pattern`,
    );
    return matchingKeys.length;
  }

  /**
   * Clear all cache
   */
  static flush(): void {
    cache.flushAll();
    console.log('🗑️  Cache FLUSHED: All keys deleted');
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return cache.getStats();
  }

  /**
   * Get all cache keys
   */
  static getKeys(): string[] {
    return cache.keys();
  }

  /**
   * Get keys by prefix
   */
  static getKeysByPrefix(prefix: string): string[] {
    return cache.keys().filter(key => key.startsWith(prefix));
  }
}

// Helper function to wrap database queries with caching
export async function withCache<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  // Try to get from cache
  const cached = CacheManager.get<T>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Fetch from database
  console.log(`🔄 Fetching from DB: ${cacheKey}`);
  const result = await fetchFunction();

  // Store in cache
  CacheManager.set(cacheKey, result, ttl);

  return result;
}

// Export cache stats endpoint helper
export const getCacheInfo = () => {
  const stats = CacheManager.getStats();
  const keys = CacheManager.getKeys();

  // Group keys by prefix
  const keysBySection: Record<string, number> = {};
  keys.forEach(key => {
    const prefix = key.split(':')[0] + ':';
    keysBySection[prefix] = (keysBySection[prefix] || 0) + 1;
  });

  return {
    stats,
    totalKeys: keys.length,
    keysBySection,
    sampleKeys: keys.slice(0, 20), // First 20 keys as sample
  };
};

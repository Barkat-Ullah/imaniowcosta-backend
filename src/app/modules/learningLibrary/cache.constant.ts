import NodeCache from 'node-cache';

export const cache = new NodeCache({
  stdTTL: 1800,
  checkperiod: 300,
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 1000,
});

export const CACHE_KEYS = {
  POST_ALL: 'posts:all',
  POST_ALL_WITH_QUERY: (query: Record<string, any>) => {
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}:${query[key]}`)
      .join('|');
    return queryString ? `posts:all:${queryString}` : 'posts:all';
  },
  POST_BY_ID: (id: string) => `post:${id}`,
  POST_PREFIX: 'posts:',
};

export const getCacheStats = () => {
  return cache.getStats();
};

export const invalidateAllPostsCaches = () => {
  const keys = cache.keys();
  const postKeys = keys.filter(key => key.startsWith(CACHE_KEYS.POST_PREFIX));

  postKeys.forEach(key => {
    cache.del(key);
  });

  console.log(`🗑️  Total post list caches invalidated: ${postKeys.length}`);
};

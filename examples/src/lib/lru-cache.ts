/**
 * A simple LRU (Least Recently Used) cache implementation.
 * Stores key-value pairs and enforces a maximum size.
 * When the size is exceeded, the least recently used item is evicted.
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private max: number;

  constructor(max: number) {
    this.cache = new Map();
    this.max = max;
  }

  /**
   * Get an item from the cache.
   * If the item exists, it is moved to the end of the cache (most recently used).
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Refresh recency
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  /**
   * Set an item in the cache.
   * If the item already exists, it is updated and moved to the end.
   * If the item is new and the cache is full, the least recently used item is evicted.
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Map.keys() returns an iterator in insertion order.
      // The first item is the oldest (least recently used).
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }

  /**
   * Get the current size of the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Clear all items from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get iterator for keys
   */
  keys(): IterableIterator<K> {
      return this.cache.keys();
  }
}

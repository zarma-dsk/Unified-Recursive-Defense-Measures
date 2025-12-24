## 2024-12-24 - Rate Limiter Optimization
**Learning:** In-memory rate limiting with `Array.filter` becomes a bottleneck at scale because it allocates new arrays and iterates fully even for sorted chronological data.
**Action:** Use `findIndex` + `slice` for chronological data to skip valid entries (common case) and only process the cutoff. Also, ensure `Map` keys are re-inserted on access to enforce true LRU behavior when using iteration order for eviction.

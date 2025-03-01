// Initialize the cache
import TTLCache from "@isaacs/ttlcache";

export const getEmployeeCache = new TTLCache({
    max: 1000,
    ttl: 86400000, // Cache for 1 day
});

export const getZonesCache = new TTLCache({
    max: 1000,
    ttl: 86400000, // Cache for 1 day
});

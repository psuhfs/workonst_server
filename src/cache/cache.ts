// Initialize the cache
import TTLCache from "@isaacs/ttlcache";

export const getEmployeeCache = new TTLCache({
    max: 1000,
    ttl: 86400000, // Cache for 1 day
});


export const getItemsCache = new TTLCache({
    max: 1000,
    ttl: 3600000, // Cache for 1 hr
});


export const getZonesCache = new TTLCache({
    max: 1000,
    ttl: 86400000, // Cache for 1 day
});

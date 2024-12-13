import TTLCache from "@isaacs/ttlcache";

const cache = new TTLCache({
    max: 1000,
    ttl: 600000, // cache for 10 minutes
});


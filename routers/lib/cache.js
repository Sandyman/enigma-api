const moment = require('moment');

let cache = {};

/**
 * Flush entire cache
 */
const flush = () => {
    cache = {};
};

/**
 * Get item from cache (or null if not found)
 * @param key
 * @returns {*}
 */
const get = (key) => {
    const item = cache[key];
    if (!item) return null;

    const now = moment();
    const value = Object.assign({}, item.value);
    item.accessed_at = now.unix();
    if (!!item.expires && item.expires_at < now.unix()) {
        setTimeout(() => delete cache[key], 0);

        // Don't return stale items
        if (!item.stale) return null;
    }
    return value;
};

/**
 * Set item in cache.
 * @param key
 * @param value
 * @param options
 */
const set = (key, value, options) => {
    const { expires, stale } = options || { expires: 3600, stale: false };
    const now = moment();
    cache[key] = {
        accessed_at: now.unix(),
        expires_at: now.add(Math.abs(expires), 'seconds').unix(),
        stale,
        value,
    }
};

module.exports = {
    flush,
    get,
    set,
};

import NodeCache from 'node-cache'

class Cache {
    cache: NodeCache

    constructor(ttlSeconds: number) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        })
    }

    async get<T>(key: string, storeFunction: () => Promise<T> | T): Promise<T> {
        const value = this.cache.get<T>(key)
        if (value !== undefined) {
            return value
        }

        const result = await storeFunction()
        this.cache.set(key, result)
        return result
    }

    flush() {
        this.cache.flushAll()
    }
}

export default Cache

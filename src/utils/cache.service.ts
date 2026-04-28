/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeCache from 'node-cache'

class Cache {
    cache: NodeCache

    constructor(ttlSeconds: number) {
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false })
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

    del(keys: string | string[]) {
        this.cache.del(keys)
    }

    delStartWith(startStr = '') {
        if (!startStr) {
            return
        }

        const keys = this.cache.keys()
        for (const key of keys) {
            if (key.indexOf(startStr) === 0) {
                this.del(key)
            }
        }
    }

    flush() {
        this.cache.flushAll()
    }
}


export default Cache
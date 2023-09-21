/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeCache from 'node-cache'

class Cache {
    cache: any

    constructor(ttlSeconds: number) {
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false })
    }

    async get(key: any, storeFunction: { (): any; }) {

        const value = this.cache.get(key)
        if (value) {
            return Promise.resolve(value)
        }

        const result = await storeFunction()
        this.cache.set(key, result)
        return result
    }

    del(keys: any) {
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
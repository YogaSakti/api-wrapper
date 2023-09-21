import fetch from 'cross-fetch'

import CacheService from './utils/cache.service'

// cache for 10 minutes
const ttl = 60 * 60 * 24
const cache = new CacheService(ttl) // Create a new cache service instance


const getOwnedByAddress = (address: string) => fetch('https://api.phantom.app/collectibles/v1', {
    headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8,id-ID;q=0.7',
        'content-type': 'application/json',
        'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'none'
    },
    'referrerPolicy': 'strict-origin-when-cross-origin',
    body: JSON.stringify({
        addresses: [
            {
                chainId: 'solana:101',
                address
            }
        ]
    }),
    method: 'POST'
}).then((res) => res.json())

const getOwned = async (address: string): Promise<any> => {
    const key = `getOwned-By-${address}`
    const cachedData = await cache.get(key, async () => await getOwnedByAddress(address))
    return cachedData
}

export default getOwned
/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'
import Cache from '../utils/cache.service'

const CMC_API_KEY = process.env.CMC_API_KEY
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com'

const cmcHeaders = {
    accept: 'application/json',
    'X-CMC_PRO_API_KEY': CMC_API_KEY || '',
}

const cache = new Cache(60) // 60 seconds TTL

/**
 * Get token price from CoinMarketCap by slug or symbol.
 * Tries slug first, falls back to symbol lookup if not found.
 * Returns { [slug]: { [fiat]: price } }
 */
export const getTokenPrice = async (slug: string, fiatCurrency: string = 'USD') => {
    const fiat = fiatCurrency.toUpperCase()
    const cacheKey = `cmc:${slug}:${fiat}`

    return cache.get(cacheKey, async () => {
        // Try slug lookup first
        const slugUrl = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?slug=${slug}&convert=${fiat}`
        const slugResponse = await fetch(slugUrl, {
            headers: cmcHeaders,
            method: 'GET',
        })
        const slugJson = await slugResponse.json()

        if (slugJson.status?.error_code === 0 && Object.keys(slugJson.data || {}).length > 0) {
            const data = slugJson.data
            const coin = data[Object.keys(data)[0]]
            const coinSlug: string = coin.slug || slug
            const price: number | null = coin.quote?.[fiat]?.price ?? null
            return { [coinSlug]: { [fiat.toLowerCase()]: price } }
        }

        // Fallback: try as symbol (uppercase)
        const symbol = slug.toUpperCase()
        const symbolUrl = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=${fiat}`
        const symbolResponse = await fetch(symbolUrl, {
            headers: cmcHeaders,
            method: 'GET',
        })
        const symbolJson = await symbolResponse.json()

        if (symbolJson.status?.error_code !== 0) {
            throw new Error(JSON.stringify({ status: 400, data: symbolJson.status }))
        }

        const data = symbolJson.data
        const key = Object.keys(data)[0]
        if (!key) return {}

        const coin = data[key]
        const coinSlug: string = coin.slug || slug
        const price: number | null = coin.quote?.[fiat]?.price ?? null

        return { [coinSlug]: { [fiat.toLowerCase()]: price } }
    })
}

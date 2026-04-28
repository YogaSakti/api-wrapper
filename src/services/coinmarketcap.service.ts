import fetch from 'cross-fetch'
import Cache from '../utils/cache.service'
import AppError from '../utils/app-error'
import { DexTokenPriceResponse, TokenPriceResponse } from '../types/api.types'

interface CmcStatus {
    error_code?: number | string
    error_message?: string
}

interface CmcQuotePrice {
    price?: number | null
}

interface CmcCoinQuote {
    slug?: string
    quote?: Record<string, CmcQuotePrice>
}

interface CmcQuoteResponse {
    status?: CmcStatus
    data?: Record<string, CmcCoinQuote>
}

interface CmcDexData {
    pdex?: string
    a?: string
    p?: number | string | null
    pc24h?: number | string | null
    pc7d?: number | string | null
    v24h?: number | string | null
    l?: number | string | null
    mc?: number | string | null
}

interface CmcDexResponse {
    status?: CmcStatus
    data?: CmcDexData
}

type CmcApiResponse = CmcQuoteResponse | CmcDexResponse

const CMC_API_KEY = process.env.CMC_API_KEY
const CMC_DEX_API_KEY = process.env.CMC_DEX_API_KEY
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com'

const cmcHeaders = {
    accept: 'application/json',
    'X-CMC_PRO_API_KEY': CMC_API_KEY || '',
}

const dexHeaders = {
    accept: 'application/json',
    'X-CMC_PRO_API_KEY': CMC_DEX_API_KEY || '',
}

const cache = new Cache(60) // 60 seconds TTL
const dexCache = new Cache(60) // 60 seconds TTL for DEX

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
    try {
        return await response.json() as T
    } catch {
        throw new AppError(502, 'Invalid response from CoinMarketCap')
    }
}

const assertCmcResponseOk = (response: Response, json: CmcApiResponse) => {
    if (!response.ok || (json.status?.error_code !== undefined && json.status.error_code !== 0 && json.status.error_code !== '0')) {
        throw new AppError(response.ok ? 400 : response.status, 'CoinMarketCap request failed', json.status || json)
    }
}

/**
 * Get token price from CoinMarketCap by slug or symbol.
 * Tries slug first, falls back to symbol lookup if not found.
 * Returns { [slug]: { [fiat]: price } }
 */
export const getTokenPrice = async (slug: string, fiatCurrency: string = 'USD'): Promise<TokenPriceResponse> => {
    const fiat = fiatCurrency.toUpperCase()
    const cacheKey = `cmc:${slug}:${fiat}`

    return cache.get<TokenPriceResponse>(cacheKey, async () => {
        // Try slug lookup first
        const slugUrl = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?slug=${slug}&convert=${fiat}`
        const slugResponse = await fetch(slugUrl, {
            headers: cmcHeaders,
            method: 'GET',
        })
        const slugJson = await parseJsonResponse<CmcQuoteResponse>(slugResponse)

        if (slugJson.status?.error_code === 0 && Object.keys(slugJson.data || {}).length > 0) {
            const data = slugJson.data || {}
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
        const symbolJson = await parseJsonResponse<CmcQuoteResponse>(symbolResponse)

        assertCmcResponseOk(symbolResponse, symbolJson)

        const data = symbolJson.data || {}
        const key = Object.keys(data)[0]
        if (!key) return {}

        const coin = data[key]
        const coinSlug: string = coin.slug || slug
        const price: number | null = coin.quote?.[fiat]?.price ?? null

        return { [coinSlug]: { [fiat.toLowerCase()]: price } }
    })
}

/**
 * Get DEX token price by contract address
 * Returns raw CMC DEX data fields
 */
export const getDexTokenPrice = async (platform: string, address: string): Promise<DexTokenPriceResponse> => {
    const cacheKey = `cmc:dex:${platform}:${address}`

    return dexCache.get<DexTokenPriceResponse>(cacheKey, async () => {
        const url = `${CMC_BASE_URL}/v1/dex/token/price?platform=${platform}&address=${address}`
        const response = await fetch(url, {
            headers: dexHeaders,
            method: 'GET',
        })
        const json = await parseJsonResponse<CmcDexResponse>(response)

        assertCmcResponseOk(response, json)

        const d = json.data || {}
        return {
            platform: d.pdex || platform,
            address: d.a || address,
            price: d.p ?? null,
            priceChange24h: d.pc24h ?? null,
            priceChange7d: d.pc7d ?? null,
            volume24h: d.v24h ?? null,
            liquidity: d.l ?? null,
            marketCap: d.mc ?? null,
        }
    })
}
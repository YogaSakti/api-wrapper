/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'

const CG_API_KEY = process.env.CG_API_KEY

/**
 * Get simple token price from CoinGecko
 */
export const getSimpleTokenPrice = async (ids: string) => {
    const url = `https://pro-api.coingecko.com/api/v3/simple/price/?ids=${ids}&vs_currencies=usd&x_cg_pro_api_key=${CG_API_KEY}`
    const response = await fetch(url, {
        headers: { accept: 'application/json' },
        method: 'GET',
    })
    return response.json()
}

/**
 * Get price by market from CoinGecko
 */
export const getPriceByMarket = async (ids: string) => {
    const url = `https://pro-api.coingecko.com/api/v3/coins/${ids}/tickers?&vs_currencies=usd&x_cg_pro_api_key=${CG_API_KEY}`
    const response = await fetch(url, {
        headers: { accept: 'application/json' },
        method: 'GET',
    })
    return response.json()
}

/**
 * Get filtered price - filters by market and trust score
 */
export const getFilteredPrice = async (slug: string) => {
    const response = await getPriceByMarket(slug)

    // If there's an error in the response
    if (response.error || response.status) {
        // coin not found
        if (response?.error?.includes('coin not found')) {
            return getSimpleTokenPrice(slug)
        }
        // other errors from CG
        if (response?.status?.error_message || response?.status?.error_code) {
            throw new Error(JSON.stringify({ status: 400, data: response.status }))
        }
        // any other error
        throw new Error(JSON.stringify({ status: 400, data: response }))
    }

    // Filter out unwanted LATOKEN, then trust_score=green
    const filteredTickersByMarket = response.tickers.filter(
        ({ market: { name } }: any) => name !== 'LATOKEN'
    )
    const filteredTickersByTrust = filteredTickersByMarket.filter(
        ({ trust_score }: any) => trust_score === 'green'
    )

    const filteredData = filteredTickersByTrust.length
        ? filteredTickersByTrust[0]
        : filteredTickersByMarket[0]

    // If we have filtered ticker data, use it
    if (filteredData && filteredData.converted_last?.usd) {
        const coinId = filteredData.base?.toLowerCase() || slug
        return { [coinId]: { usd: filteredData.converted_last.usd } }
    }

    // Fallback to simple price if no filtered data found
    return getSimpleTokenPrice(slug)
}
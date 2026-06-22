/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'
import { MainClient } from 'binance'
import { RestClientV5 } from 'bybit-api'
import { RestClient } from 'okx-api'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { RestClientV2 } from 'bitget-api'

if (!process.env.KEY_BINANCE || !process.env.SECRET_BINANCE) {
    throw new Error('Binance API key and secret must be set in the environment variables.')
}
if (!process.env.KEY_BYBIT || !process.env.SECRET_BYBIT) {
    throw new Error('Bybit API key and secret must be set in the environment variables.')
}
if (!process.env.KEY_OKX || !process.env.SECRET_OKX || !process.env.PASS_OKX) {
    throw new Error('OKX API key, secret, and passphrase must be set in the environment variables.')
}
if (!process.env.KEY_BITGET || !process.env.SECRET_BITGET || !process.env.PASS_BITGET) {
    throw new Error('Bitget API key, secret, and passphrase must be set in the environment variables.')
}

const binanceClient = new MainClient({
    api_key: process.env.KEY_BINANCE,
    api_secret: process.env.SECRET_BINANCE,
})

const bybitClient = new RestClientV5({
    testnet: false,
    key: process.env.KEY_BYBIT,
    secret: process.env.SECRET_BYBIT,
})

const okxClient = new RestClient({
    apiKey: process.env.KEY_OKX,
    apiSecret: process.env.SECRET_OKX,
    apiPass: process.env.PASS_OKX,
})

const bitgetClient = new RestClientV2({
    apiKey: process.env.KEY_BITGET,
    apiSecret: process.env.SECRET_BITGET,
    apiPass: process.env.PASS_BITGET,
})

/**
 * Compute the mid price from order book bid/ask levels.
 * Each level is expected to be a [price, size] tuple.
 */
const computeMidPrice = (bids: any, asks: any): number => {
    if (!Array.isArray(bids) || !Array.isArray(asks) || bids.length === 0 || asks.length === 0) {
        throw new Error('No order book data found')
    }
    const bidPrice = parseFloat(bids[0]?.[0])
    const askPrice = parseFloat(asks[0]?.[0])
    if (isNaN(bidPrice) || isNaN(askPrice)) {
        throw new Error('Invalid price data')
    }
    return (bidPrice + askPrice) / 2
}

export const SUPPORTED_PINTU_CURRENCIES = ['USDT', 'USDC'] as const

export const normalizePintuCurrency = (quoteCurrency: string = 'USDT'): string => {
    return quoteCurrency.trim().toUpperCase()
}

export const isSupportedPintuCurrency = (quoteCurrency: string): boolean => {
    return SUPPORTED_PINTU_CURRENCIES.includes(normalizePintuCurrency(quoteCurrency) as typeof SUPPORTED_PINTU_CURRENCIES[number])
}

export const buildPintuCandlesticksUrl = (quoteCurrency: string = 'USDT'): string => {
    const normalizedCurrency = normalizePintuCurrency(quoteCurrency)
    return `https://api.pintu.pro/v1/public/get-candlesticks?symbol=${normalizedCurrency}-IDR&interval=1m`
}

/**
 * Fetch stablecoin price from Pintu (IDR)
 */
export const getPintuPrice = async (quoteCurrency: string = 'USDT'): Promise<number | null> => {
    try {
        const response = await fetch(buildPintuCandlesticksUrl(quoteCurrency), {
            headers: {
                accept: 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                Referer: 'https://pintu.co.id/',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            body: null,
            method: 'GET'
        })

        const json = await response.json()
        if (!json?.data) {
            throw new Error('Unexpected Pintu response structure.')
        }
        const candlesData = json.data.candlesticks
        if (!candlesData || candlesData.length === 0) {
            throw new Error('No data found in Pintu response.')
        }
        const firstData = candlesData[0] || {}
        const currentPrice = firstData?.c || 0
        return parseFloat(currentPrice) || 0
    } catch (error) {
        console.error('Pintu fetch error:', error)
        return null
    }
}

/**
 * Fetch average price from Binance order book (via the binance SDK module)
 */
export const getBinanceOrderBookPrice = async (symbol: string = 'USD1USDT', limit: number = 10): Promise<number | null> => {
    try {
        const data: any = await binanceClient.getOrderBook({ symbol, limit: limit as any })
        return computeMidPrice(data?.bids, data?.asks)
    } catch (error) {
        console.error('Binance fetch error:', error)
        return null
    }
}

/**
 * Fetch average price from Bybit spot order book (via the bybit-api SDK module)
 */
export const getBybitOrderBookPrice = async (symbol: string = 'USDEUSDT', limit: number = 10): Promise<number | null> => {
    try {
        const response: any = await bybitClient.getOrderbook({ category: 'spot', symbol, limit })
        // Bybit wraps results in result.b (bids) / result.a (asks)
        return computeMidPrice(response?.result?.b, response?.result?.a)
    } catch (error) {
        console.error('Bybit fetch error:', error)
        return null
    }
}

/**
 * Fetch average price from OKX order book (via the okx-api SDK module).
 * OKX uses an instrument id (e.g. USD1-USDC) and a `sz` depth size.
 */
export const getOkxOrderBookPrice = async (instId: string = 'USDG-USDT', limit: number = 10): Promise<number | null> => {
    try {
        const response: any = await okxClient.getOrderBook({ instId, sz: String(limit) })
        // okx-api unwraps the response into a `data` array of order book snapshots
        const book = Array.isArray(response) ? response[0] : undefined
        return computeMidPrice(book?.bids, book?.asks)
    } catch (error) {
        console.error('OKX fetch error:', error)
        return null
    }
}

/**
 * Fetch average price from Bitget spot order book (via the bitget-api SDK module)
 */
export const getBitgetOrderBookPrice = async (symbol: string = 'USDGOUSDT', limit: number = 10): Promise<number | null> => {
    try {
        const response: any = await bitgetClient.getSpotOrderBookDepth({ symbol, type: 'step0', limit: String(limit) })
        return computeMidPrice(response?.data?.bids, response?.data?.asks)
    } catch (error) {
        console.error('Bitget fetch error:', error)
        return null
    }
}